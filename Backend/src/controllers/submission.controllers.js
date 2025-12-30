import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Submission from "../models/Submission.model.js";
import Team from "../models/Team.model.js";
import Round from "../models/Round.model.js";
import Hackathon from "../models/Hackathon.model.js";
import mongoose from "mongoose";

export const createSubmission = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  const {
    title,
    description,
    submissionType,
    pptUrl,
    videoUrl,
    githubUrl,
    liveDemoUrl,
    screenshots,
    documentUrl,
    additionalLinks,
    technologies,
    teamId
  } = req.body;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  if (!teamId) {
    throw new apiError(400, "Team ID is required");
  }

  if (!title?.trim() || !description?.trim()) {
    throw new apiError(400, "Title and description are required");
  }


  const round = await Round.findById(roundId).populate("hackathon");
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  if (!round.canSubmit()) {
    throw new apiError(400, "This round is not accepting submissions");
  }

  // Verify team exists and user is a member
  const team = await Team.findById(teamId);
  if (!team) {
    throw new apiError(404, "Team not found");
  }

  if (!team.hasMember(req.user._id)) {
    throw new apiError(403, "You are not a member of this team");
  }

  // Check if team is registered for this hackathon
  if (team.hackathon.toString() !== round.hackathon._id.toString()) {
    throw new apiError(400, "Team is not registered for this hackathon");
  }

  // Check if submission already exists for this team and round
  const existingSubmission = await Submission.findOne({
    team: teamId,
    round: roundId
  });

  if (existingSubmission) {
    throw new apiError(400, "Team has already submitted for this round");
  }

  // Validate submission type
  const validTypes = ["ppt", "video", "github", "live_demo", "screenshot", "document", "multiple"];
  if (!validTypes.includes(submissionType)) {
    throw new apiError(400, "Invalid submission type");
  }

  // Check if submission is late
  const now = new Date();
  const isLate = now > round.endDate;

  // Create submission
  const submission = await Submission.create({
    team: teamId,
    round: roundId,
    hackathon: round.hackathon._id,
    title: title.trim(),
    description: description.trim(),
    submissionType,
    pptUrl: pptUrl || undefined,
    videoUrl: videoUrl || undefined,
    githubUrl: githubUrl || undefined,
    liveDemoUrl: liveDemoUrl || undefined,
    screenshots: screenshots || [],
    documentUrl: documentUrl || undefined,
    additionalLinks: additionalLinks || [],
    technologies: technologies || [],
    submittedBy: req.user._id,
    isLateSubmission: isLate,
    status: "submitted"
  });

  // Add submission to round
  round.submissions.push(submission._id);
  await round.save();

  // Add submission to team
  team.submissions.push(submission._id);
  await team.save();

  await submission.populate([
    { path: "team", select: "name leader members" },
    { path: "submittedBy", select: "name email" },
    { path: "round", select: "name roundNumber" }
  ]);

  return res.status(201).json(
    new ApiResponse(201, submission, "Submission created successfully")
  );
});

// Get all submissions for a round
export const getSubmissionsByRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(roundId);
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  const submissions = await Submission.find({ round: roundId })
    .populate("team", "name leader members")
    .populate("submittedBy", "name email")
    .populate("round", "name roundNumber")
    .sort({ submittedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, submissions, "Submissions fetched successfully")
  );
});

// Get all submissions for a hackathon
export const getSubmissionsByHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!hackathonId) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  const submissions = await Submission.find({ hackathon: hackathonId })
    .populate("team", "name leader members")
    .populate("submittedBy", "name email")
    .populate("round", "name roundNumber")
    .sort({ submittedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, submissions, "Submissions fetched successfully")
  );
});

// Get submissions by team
export const getSubmissionsByTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  if (!teamId) {
    throw new apiError(400, "Team ID is required");
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw new apiError(404, "Team not found");
  }

  const submissions = await Submission.find({ team: teamId })
    .populate("round", "name roundNumber startDate endDate")
    .populate("submittedBy", "name email")
    .populate("evaluations")
    .sort({ submittedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, submissions, "Team submissions fetched successfully")
  );
});

// Get a particular submission
export const getSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Submission ID is required");
  }

  const submission = await Submission.findById(id)
    .populate("team", "name leader members projectName projectDescription")
    .populate("submittedBy", "name email")
    .populate("round", "name roundNumber startDate endDate criteria")
    .populate("hackathon", "title")
    .populate({
      path: "evaluations",
      populate: {
        path: "judge",
        select: "name email"
      }
    });

  if (!submission) {
    throw new apiError(404, "Submission not found");
  }

  return res.status(200).json(
    new ApiResponse(200, submission, "Submission details fetched successfully")
  );
});

// Update a submission
export const updateSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    pptUrl,
    videoUrl,
    githubUrl,
    liveDemoUrl,
    screenshots,
    documentUrl,
    additionalLinks,
    technologies
  } = req.body;

  if (!id) {
    throw new apiError(400, "Submission ID is required");
  }

  const submission = await Submission.findById(id).populate("team round");

  if (!submission) {
    throw new apiError(404, "Submission not found");
  }

  // Check if user is a team member
  if (!submission.team.hasMember(req.user._id)) {
    throw new apiError(403, "Only team members can update this submission");
  }

  // Check if round is still accepting submissions
  if (!submission.round.canSubmit()) {
    throw new apiError(400, "Cannot update submission - round is closed");
  }

  // Check if submission has been evaluated
  if (submission.evaluations && submission.evaluations.length > 0) {
    throw new apiError(400, "Cannot update submission after it has been evaluated");
  }

  // Update fields
  if (title) submission.title = title.trim();
  if (description) submission.description = description.trim();
  if (pptUrl !== undefined) submission.pptUrl = pptUrl;
  if (videoUrl !== undefined) submission.videoUrl = videoUrl;
  if (githubUrl !== undefined) submission.githubUrl = githubUrl;
  if (liveDemoUrl !== undefined) submission.liveDemoUrl = liveDemoUrl;
  if (screenshots) submission.screenshots = screenshots;
  if (documentUrl !== undefined) submission.documentUrl = documentUrl;
  if (additionalLinks) submission.additionalLinks = additionalLinks;
  if (technologies) submission.technologies = technologies;

  await submission.save();

  await submission.populate([
    { path: "team", select: "name leader members" },
    { path: "submittedBy", select: "name email" },
    { path: "round", select: "name roundNumber" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, submission, "Submission updated successfully")
  );
});

// Delete a submission
export const deleteSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Submission ID is required");
  }

  const submission = await Submission.findById(id).populate("team round");

  if (!submission) {
    throw new apiError(404, "Submission not found");
  }

  // Check if user is team leader or admin/organizer
  const isTeamLeader = submission.team.leader.toString() === req.user._id.toString();
  const isAuthorized = ["admin", "organizer"].includes(req.user.role);

  if (!isTeamLeader && !isAuthorized) {
    throw new apiError(403, "Only team leader, admin or organizer can delete this submission");
  }

  // Check if submission has been evaluated
  if (submission.evaluations && submission.evaluations.length > 0) {
    throw new apiError(400, "Cannot delete submission after it has been evaluated");
  }

  // Remove submission from round
  await Round.findByIdAndUpdate(submission.round._id, {
    $pull: { submissions: submission._id }
  });

  // Remove submission from team
  await Team.findByIdAndUpdate(submission.team._id, {
    $pull: { submissions: submission._id }
  });

  // Delete the submission
  await Submission.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, "Submission deleted successfully")
  );
});

// Get submission statistics for a round
export const getSubmissionStats = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(roundId);
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  const totalSubmissions = await Submission.countDocuments({ round: roundId });
  const lateSubmissions = await Submission.countDocuments({ 
    round: roundId, 
    isLateSubmission: true 
  });
  const evaluatedSubmissions = await Submission.countDocuments({
    round: roundId,
    evaluationStatus: "completed"
  });
  const pendingEvaluations = await Submission.countDocuments({
    round: roundId,
    evaluationStatus: { $in: ["pending", "in_progress"] }
  });

  // Get submission type breakdown
  const typeBreakdown = await Submission.aggregate([
    { $match: { round: new mongoose.Types.ObjectId(roundId) } },
    { $group: { _id: "$submissionType", count: { $sum: 1 } } }
  ]);

  const stats = {
    totalSubmissions,
    lateSubmissions,
    evaluatedSubmissions,
    pendingEvaluations,
    onTimeSubmissions: totalSubmissions - lateSubmissions,
    submissionTypes: typeBreakdown
  };

  return res.status(200).json(
    new ApiResponse(200, stats, "Submission statistics fetched successfully")
  );
});