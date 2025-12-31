import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Team from "../models/Team.model.js";
import Hackathon from "../models/Hackathon.model.js";
import User from "../models/User.models.js";
import mongoose from "mongoose";
import { sendMail } from "../utils/sendMail.js";

const isUserInHackathonTeam = async (userId, hackathonId) => {
  return await Team.findOne({
    hackathon: hackathonId,
    $or: [{ leader: userId }, { members: userId }]
  });
};


export const createTeam = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { name, projectName, projectDescription, technologies } = req.body;
  const userId = req.user._id;

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new apiError(404, "Hackathon not found");

  // Check if user is already in a team
  const existingTeam = await Team.findOne({
    hackathon: hackathonId,
    $or: [{ leader: userId }, { members: userId }]
  });
  if (existingTeam) throw new apiError(400, "You are already in a team for this hackathon");

  const team = await Team.create({
    name,
    hackathon: hackathonId,
    leader: userId,
    members: [userId],
    projectName,
    projectDescription,
    technologies
  });

  // Add team & leader to hackathon
  await hackathon.addTeamParticipants(team);

  await team.populate("leader members", "name email");

  return res.status(201).json(
    new ApiResponse(201, team, "Team created and registered for hackathon successfully")
  );
});



export const getTeamsByHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const teams = await Team.find({ hackathon: hackathonId })
    .populate("leader members", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, teams, "Teams fetched successfully")
  );
});


export const getTeamById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await Team.findById(id)
    .populate("leader members", "name email");
  if (!team) throw new apiError(404, "Team not found");

  return res.status(200).json(
    new ApiResponse(200, team, "Team details fetched successfully")
  );
});


export const updateTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const userId = req.user._id;

  const team = await Team.findById(id);
  if (!team) throw new apiError(404, "Team not found");
  if (team.leader.toString() !== userId.toString())
    throw new apiError(403, "Only team leader can update team");

  Object.assign(team, updates);
  await team.save();

  await team.populate("leader members", "name email");

  return res.status(200).json(
    new ApiResponse(200, team, "Team updated successfully")
  );
});

// Delete team (leader only)
export const deleteTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(id);
  if (!team) throw new apiError(404, "Team not found");
  if (team.leader.toString() !== userId.toString())
    throw new apiError(403, "Only team leader can delete team");

  await team.remove();

  return res.status(200).json(
    new ApiResponse(200, null, "Team deleted successfully")
  );
});

export const inviteMemberToTeam = asyncHandler(async (req, res) => {
  const { id } = req.params; // Team ID
  const { email } = req.body; // Email to invite

  if (!email) throw new apiError(400, "Email is required");

  const team = await Team.findById(id).populate("hackathon");
  if (!team) throw new apiError(404, "Team not found");

  // Only team leader can invite
  if (team.leader.toString() !== req.user._id.toString())
    throw new apiError(403, "Only team leader can invite members");

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });
  const userId = user?._id || null;

  // If user exists, check if already in a team
  if (userId) {
    const existingTeam = await Team.findOne({
      hackathon: team.hackathon._id,
      $or: [{ leader: userId }, { members: userId }]
    });
    if (existingTeam) throw new apiError(400, "User is already in another team for this hackathon");
  }

  // Check if already invited
  const alreadyInvited = team.invitedMembers.some(
    im => (im.user?.toString() === userId?.toString() || im.email === email.toLowerCase()) && im.status === "pending"
  );
  if (alreadyInvited) throw new apiError(400, "User is already invited to this team");

  // Add invitation
  team.invitedMembers.push({
    user: userId,
    email: email.toLowerCase(),
    status: "pending"
  });
  await team.save();

  // Send email invite
  const acceptLink = `${process.env.FRONTEND_URL}/team-invite/${team._id}?email=${encodeURIComponent(email)}`;
  console.log("accept link : " + acceptLink)
  await sendMail(
    email,
    `Invitation to join ${team.name} in ${team.hackathon.title}`,
    `<p>Hi,</p>
     <p>${req.user.name} invited you to join their team "<strong>${team.name}</strong>" for the hackathon "<strong>${team.hackathon.title}</strong>".</p>
     <p><a href="${acceptLink}">Click here to accept the invitation</a></p>
     <p>If you are not registered yet, please sign up to join the team.</p>`
  );

  return res.status(200).json(
    new ApiResponse(200, team, "Invitation sent successfully")
  );
});


export const acceptTeamInvite = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const userEmail = req.query.email?.toLowerCase(); // email from invite link
  
  let user = req.user;

  if (userEmail) {
    const invitedUser = await User.findOne({ email: userEmail });

    if (invitedUser) {
      user = invitedUser;
    } else {
      return res.status(200).json(
        new ApiResponse(
          200,
          { teamId, email: userEmail },
          "User not registered, redirect to signup"
        )
      );
    }
  }


  const team = await Team.findById(teamId).populate("hackathon");
  if (!team) throw new apiError(404, "Team not found");

  // If no JWT user, try finding by email
  if (!user && userEmail) {
    user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(200).json(
        new ApiResponse(200, { teamId, email: userEmail }, "User not registered, redirect to signup")
      );
    }
  }

  if (!user) throw new apiError(400, "Invalid invitation link");

  // Find the pending invite
  const invite = team.invitedMembers.find(im => {
    if (im.status !== "pending") return false;
    if (im.user && im.user.toString() === user._id.toString()) return true;
    if (im.email && im.email.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  });

  if (!invite) throw new apiError(400, "No pending invitation found");

  // Check if user is already in another team for this hackathon
  const existingTeam = await Team.findOne({
    hackathon: team.hackathon._id,
    $or: [{ leader: user._id }, { members: user._id }]
  });
  if (existingTeam) throw new apiError(400, "You are already in another team for this hackathon");

  // Accept invite
  invite.status = "accepted";

  // Add user to team & hackathon
  await team.addMember(user._id, team.hackathon);
  await team.hackathon.addParticipant(user._id);

  await team.hackathon.save();
  await team.save();

  return res.status(200).json(
    new ApiResponse(200, team, "Invitation accepted and user added to team")
  );
});






export const removeMemberFromTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const team = await Team.findById(id);
  if (!team) throw new apiError(404, "Team not found");
  if (team.leader.toString() !== req.user._id.toString())
    throw new apiError(403, "Only team leader can remove members");

  await team.removeMember(userId);

  await team.populate("leader members", "name email");

  return res.status(200).json(
    new ApiResponse(200, team, "Member removed successfully")
  );
});


export const leaveTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const team = await Team.findById(id);
  if (!team) throw new apiError(404, "Team not found");

  if (team.leader.toString() === userId.toString())
    throw new apiError(403, "Leader cannot leave the team. Delete or transfer leadership.");

  await team.removeMember(userId);

  return res.status(200).json(
    new ApiResponse(200, null, "You have left the team successfully")
  );
});
