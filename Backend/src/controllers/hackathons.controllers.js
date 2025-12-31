import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import User from "../models/User.models.js";
import Hackathon from "../models/Hackathon.model.js";
import Round from "../models/Round.model.js";
import Criteria from "../models/Criteria.Schema.js";
import mongoose from "mongoose";
import Submission from "../models/Submission.model.js";

const create = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    startDate,
    endDate,
    maxTeamSize,
    maxParticipants,
    prizes,
    banner,
    registrationDeadline
  } = req.body;

  if (!title?.trim() || !description?.trim() || !startDate || !endDate) {
    throw new apiError(400, "Title, description, start date and end date are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start >= end) {
    throw new apiError(400, "End date must be after start date");
  }

  if (start < now) {
    throw new apiError(400, "Start date cannot be in the past");
  }

  if (registrationDeadline) {
    const regDeadline = new Date(registrationDeadline);
    if (regDeadline > start) {
      throw new apiError(400, "Registration deadline must be before or on start date");
    }
  }

  const hackathon = await Hackathon.create({
    title: title.trim(),
    description: description.trim(),
    startDate: start,
    endDate: end,
    maxTeamSize: maxTeamSize || 1,
    maxParticipants: maxParticipants || null,
    organizer: req.user._id,
    prizes: prizes || [],
    banner: banner || null,
    registrationDeadline: registrationDeadline || null,
    status: "upcoming"
  });

  await hackathon.populate("organizer", "name email");

  return res.status(201).json(
    new ApiResponse(201, hackathon, "Hackathon created successfully")
  );
});

const getAll = asyncHandler(async (req, res) => {
  const hackathons = await Hackathon.find()
    .populate("organizer", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, hackathons, "All hackathons fetched")
  );
});

const getParticular = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(id).populate([
    {
      path: "organizer",
      select: "name email role"
    },
    {
      path: "judges",
      select: "name email"
    },
    {
      path: "rounds",
      populate: {
        path: "criteria"
      }
    },
    {
      path: "teams",
      select: "name leader members"
    }
  ]);

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  res.status(200).json(
    new ApiResponse(200, hackathon, "Hackathon details fetched")
  );
});

const addRounds = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rounds } = req.body;

  if (!Array.isArray(rounds) || rounds.length === 0) {
    throw new apiError(400, "Rounds array is required");
  }

  const hackathon = await Hackathon.findById(id).populate("organizer");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check if requester is the organizer
  if (req.user._id.toString() !== hackathon.organizer._id.toString()) {
    throw new apiError(403, "Only the organizer can add rounds to this hackathon");
  }

  const createdRounds = [];

  for (const r of rounds) {
    const { name, description, roundNumber, submissionType, startDate, endDate, maxMarks, criteria } = r;

    if (!name || !roundNumber || !submissionType || !startDate || !endDate) {
      throw new apiError(400, "All round fields (name, roundNumber, submissionType, startDate, endDate) are required");
    }

    // Validate round dates
    const roundStart = new Date(startDate);
    const roundEnd = new Date(endDate);

    if (roundStart >= roundEnd) {
      throw new apiError(400, `Round "${name}": End date must be after start date`);
    }

    // Create Round
    const roundDoc = await Round.create({
      name,
      description,
      roundNumber,
      submissionType,
      startDate: roundStart,
      endDate: roundEnd,
      maxMarks: maxMarks || 100,
      hackathon: hackathon._id
    });

    // Validate and create criteria
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw new apiError(400, `Criteria are required for round "${name}"`);
    }

    const criteriaDocs = [];

    for (const c of criteria) {
      const { name: criteriaName, description: criteriaDesc, weight, maxScore, order } = c;

      if (!criteriaName || weight == null || maxScore == null) {
        throw new apiError(400, "All criteria fields are required (name, weight, maxScore)");
      }

      const criteriaDoc = await Criteria.create({
        name: criteriaName,
        description: criteriaDesc || "",
        weight,
        maxScore,
        order: order || 0,
        round: roundDoc._id
      });

      criteriaDocs.push(criteriaDoc._id);
    }

    // Link criteria to round
    roundDoc.criteria = criteriaDocs;
    await roundDoc.save();

    createdRounds.push(roundDoc._id);
  }

  // Link rounds to hackathon
  hackathon.rounds.push(...createdRounds);
  await hackathon.save();

  // Populate and return
  const updatedHackathon = await Hackathon.findById(id).populate({
    path: "rounds",
    populate: {
      path: "criteria"
    }
  });

  return res.status(201).json(
    new ApiResponse(201, updatedHackathon, "Rounds (with criteria) added successfully")
  );
});

const updateRound = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Round ID is required");
  }

  const { name, description, roundNumber, submissionType, startDate, endDate, maxMarks, criteria } = req.body;

  const round = await Round.findById(id).populate("hackathon");

  if (!round) {
    throw new apiError(404, "Round not found");
  }

  // Get hackathon to check organizer
  const hackathon = await Hackathon.findById(round.hackathon._id).populate("organizer");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check if requester is the organizer
  if (req.user._id.toString() !== hackathon.organizer._id.toString()) {
    throw new apiError(403, "Only the organizer can update rounds");
  }

  // Update round fields
  if (name) round.name = name.trim();
  if (description) round.description = description.trim();
  if (roundNumber) round.roundNumber = roundNumber;
  if (submissionType) round.submissionType = submissionType;
  if (startDate) round.startDate = new Date(startDate);
  if (endDate) round.endDate = new Date(endDate);
  if (maxMarks) round.maxMarks = maxMarks;

  // Validate dates if both are provided
  if (round.startDate && round.endDate && round.startDate >= round.endDate) {
    throw new apiError(400, "End date must be after start date");
  }

  // Update criteria if provided
  if (Array.isArray(criteria)) {
    // Delete old criteria
    await Criteria.deleteMany({ round: round._id });
    const newCriteriaDocs = [];

    for (const c of criteria) {
      const { name: criteriaName, description: criteriaDesc, weight, maxScore, order } = c;

      if (!criteriaName || weight == null || maxScore == null) {
        throw new apiError(400, "Each criteria must have name, weight, and maxScore");
      }

      const newCriteria = await Criteria.create({
        name: criteriaName,
        description: criteriaDesc || "",
        weight,
        maxScore,
        order: order || 0,
        round: round._id
      });

      newCriteriaDocs.push(newCriteria._id);
    }

    round.criteria = newCriteriaDocs;
  }

  await round.save();

  const updatedRound = await Round.findById(id).populate("criteria");

  return res.status(200).json(
    new ApiResponse(200, updatedRound, "Round updated successfully")
  );
});

const deleteRound = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(id).populate("hackathon");

  if (!round) {
    throw new apiError(404, "Round not found");
  }

  const hackathon = await Hackathon.findById(round.hackathon._id).populate("organizer");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check if requester is the organizer
  if (req.user._id.toString() !== hackathon.organizer._id.toString()) {
    throw new apiError(403, "Only the organizer can delete rounds");
  }

  // Delete associated criteria
  await Criteria.deleteMany({ round: round._id });

  // Delete associated submissions if model exists
  try {
    const Submission = mongoose.model("Submission");
    await Submission.deleteMany({ round: round._id });
  } catch (error) {
    // Submission model not registered yet, skip
  }

  // Remove round reference from hackathon
  hackathon.rounds = hackathon.rounds.filter(
    r => r.toString() !== round._id.toString()
  );
  await hackathon.save();

  // Delete the round
  await Round.findByIdAndDelete(id);

  res.status(200).json(
    new ApiResponse(200, null, "Round deleted successfully")
  );
});

const updateHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const {
    title,
    description,
    startDate,
    endDate,
    maxTeamSize,
    maxParticipants,
    prizes,
    banner,
    registrationDeadline,
    status
  } = req.body;

  const hackathon = await Hackathon.findById(id).populate("organizer");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  if (req.user._id.toString() !== hackathon.organizer._id.toString()) {
    throw new apiError(403, "You do not have permission to update this hackathon");
  }

  // Validate dates if both provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      throw new apiError(400, "End date must be after start date");
    }
  }

  // Validate registration deadline
  if (registrationDeadline && (startDate || hackathon.startDate)) {
    const reg = new Date(registrationDeadline);
    const start = startDate ? new Date(startDate) : hackathon.startDate;
    if (reg > start) {
      throw new apiError(400, "Registration deadline must be before start date");
    }
  }

  // Update fields
  if (title) hackathon.title = title.trim();
  if (description) hackathon.description = description.trim();
  if (startDate) hackathon.startDate = new Date(startDate);
  if (endDate) hackathon.endDate = new Date(endDate);
  if (maxTeamSize) hackathon.maxTeamSize = maxTeamSize;
  if (maxParticipants !== undefined) hackathon.maxParticipants = maxParticipants;
  if (prizes) hackathon.prizes = prizes;
  if (banner !== undefined) hackathon.banner = banner;
  if (registrationDeadline) hackathon.registrationDeadline = new Date(registrationDeadline);
  if (status) hackathon.status = status;

  await hackathon.save();

  const updatedHackathon = await Hackathon.findById(id).populate([
    { path: "organizer", select: "name email" },
    { path: "judges", select: "name email" },
    { path: "rounds", populate: { path: "criteria" } }
  ]);

  return res.status(200).json(
    new ApiResponse(200, updatedHackathon, "Hackathon updated successfully")
  );
});

const deleteHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(id).populate("organizer");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  if (req.user._id.toString() !== hackathon.organizer._id.toString()) {
    throw new apiError(403, "You do not have permission to delete this hackathon");
  }
  const rounds = await Round.find({ hackathon: hackathon._id });
  for (const round of rounds) {
    // Delete criteria for each round
    await Criteria.deleteMany({ round: round._id });

    // Delete submissions if model exists
    try {
      const Submission = mongoose.model("Submission");
      await Submission.deleteMany({ round: round._id });
    } catch (error) {
      // Submission model not registered yet, skip
    }
  }

  // Delete all rounds
  await Round.deleteMany({ hackathon: hackathon._id });

  // Delete the hackathon
  await Hackathon.findByIdAndDelete(hackathon._id);

  return res.status(200).json(
    new ApiResponse(200, {}, "Hackathon and related data deleted successfully")
  );
});


const assignJudge = asyncHandler(async (req, res) => {
  const { id: hackathonId } = req.params;
  const { judgeId } = req.body;

  if (!hackathonId) {
    throw new apiError(400, "Hackathon ID is required");
  }

  if (!judgeId) {
    throw new apiError(400, "Judge ID is required");
  }

  const hackathon = await Hackathon.findById(hackathonId).populate("organizer");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Organizer check
  if (req.user._id.toString() !== hackathon.organizer._id.toString()) {
    throw new apiError(403, "Only the organizer can assign judges");
  }

  const judge = await User.findById(judgeId);

  if (!judge) {
    throw new apiError(404, "Judge not found");
  }

  if (judge.role !== "judge") {
    throw new apiError(400, "User must have 'judge' role");
  }

  // Prevent duplicate assignment (hackathon side)
  if (hackathon.judges.some(j => j.toString() === judgeId.toString())) {
    throw new apiError(400, "Judge is already assigned to this hackathon");
  }

  // ✅ Add on BOTH sides (use addToSet to avoid duplicates)
  hackathon.judges.addToSet(judgeId);
  judge.hackathonsJoined.addToSet(hackathonId);

  await Promise.all([
    hackathon.save(),
    judge.save()
  ]);

  const updatedHackathon = await Hackathon.findById(hackathonId)
    .populate("organizer", "name email")
    .populate("judges", "name email");

  return res.status(200).json(
    new ApiResponse(200, updatedHackathon, "Judge assigned successfully")
  );
});


const removeJudge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { judgeId } = req.body;

  if (!id) {
    throw new apiError(400, "Hackathon ID is required");
  }

  if (!judgeId) {
    throw new apiError(400, "Judge ID is required");
  }

  const hackathon = await Hackathon.findById(id).populate("organizer");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check if requester is the organizer
  if (req.user._id.toString() !== hackathon.organizer._id.toString()) {
    throw new apiError(403, "Only the organizer can remove judges");
  }

  // Check if judge exists
  const judge = await User.findById(judgeId);

  if (!judge) {
    throw new apiError(404, "Judge not found");
  }

  // Check if judge is assigned to this hackathon
  const judgeIndex = hackathon.judges.findIndex(
    j => j.toString() === judgeId.toString()
  );

  if (judgeIndex === -1) {
    throw new apiError(400, "Judge is not assigned to this hackathon");
  }

  // Remove judge from hackathon
  hackathon.judges.splice(judgeIndex, 1);
  await hackathon.save();

  const updatedHackathon = await Hackathon.findById(id)
    .populate("organizer", "name email")
    .populate("judges", "name email");

  return res.status(200).json(
    new ApiResponse(200, updatedHackathon, "Judge removed successfully")
  );
});

const joinHackathon = asyncHandler(async (req, res) => {
  // TODO: Implement after deciding on participation flow
  // Options:
  // 1. Individual registration (add user to participants array)
  // 2. Team-based registration (create/join team first, then register)
  throw new apiError(501, "Join hackathon feature not yet implemented");
});

const allJudges = asyncHandler(async(req,res)=>{
  const judges = await User.find({role : "judge"})
  res.status(200).json(new ApiResponse(200 , judges , "all judges fetched"))
})

const getJudgeSubmissions = asyncHandler(async (req, res) => {
  const judge = req.user;

  if (judge.role !== "judge") {
    throw new apiError(403, "Only judges can access submissions");
  }

  if (!judge.hackathonsJoined || judge.hackathonsJoined.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No hackathons assigned")
    );
  }

  const submissions = await Submission.find({
    hackathon: { $in: judge.hackathonsJoined }
  })
    .populate("hackathon", "title")
    .populate("round", "name roundNumber")
    .populate("team", "name projectName")
    .populate("submittedBy", "name email")
    .sort({ submittedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, submissions, "Judge submissions fetched")
  );
});

const getJudgeHackathonSubmissions = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const judge = req.user;

  if (!judge.hackathonsJoined.includes(hackathonId)) {
    throw new apiError(403, "You are not assigned to this hackathon");
  }

  const submissions = await Submission.find({
    hackathon: hackathonId
  })
    .populate("round", "name roundNumber")
    .populate("team", "name projectName")
    .populate("submittedBy", "name email")
    .sort({ submittedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, submissions, "Hackathon submissions fetched")
  );
});

const getJudgeRoundSubmissions = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  const judge = req.user;

  const submissions = await Submission.find({ round: roundId })
    .populate("hackathon", "title")
    .populate("team", "name projectName")
    .populate("submittedBy", "name email");

  // Authorization check (important)
  const unauthorized = submissions.some(
    s => !judge.hackathonsJoined.includes(s.hackathon._id.toString())
  );

  if (unauthorized) {
    throw new apiError(403, "Unauthorized access to round submissions");
  }

  return res.status(200).json(
    new ApiResponse(200, submissions, "Round submissions fetched")
  );
});


export {
  create,
  getAll,
  getParticular,
  updateHackathon,
  deleteHackathon,
  joinHackathon,
  assignJudge,
  removeJudge,
  addRounds,
  updateRound,
  deleteRound,
  allJudges,
  getJudgeSubmissions,
  getJudgeRoundSubmissions,
  getJudgeHackathonSubmissions
};