import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Evaluation from "../models/Evaluations.model.js";
import Submission from "../models/Submission.model.js";
import Round from "../models/Round.model.js";
import Hackathon from "../models/Hackathon.model.js";
import Criteria from "../models/Criteria.Schema.js";
import mongoose from "mongoose";


// Create or update evaluation for a submission (Judges only)
export const evaluateSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { scores, feedback, strengths, improvements, status } = req.body;

  if (!submissionId) {
    throw new apiError(400, "Submission ID is required");
  }

  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    throw new apiError(400, "Scores array is required");
  }

  // Normalize status
  const finalStatus = status || "submitted";

  // Fetch submission
  const submission = await Submission.findById(submissionId)
    .populate("round")
    .populate("hackathon");

  if (!submission) {
    throw new apiError(404, "Submission not found");
  }

  // Verify judge is assigned to hackathon
  const hackathon = await Hackathon.findById(submission.hackathon._id);

  if (
    !hackathon.judges.some(
      j => j.toString() === req.user._id.toString()
    )
  ) {
    throw new apiError(403, "You are not assigned as a judge for this hackathon");
  }

  // Fetch criteria for the round
  const criteria = await Criteria.find({ round: submission.round._id });

  if (!criteria || criteria.length === 0) {
    throw new apiError(400, "No evaluation criteria defined for this round");
  }

  // Validate criteria coverage
  const criteriaIds = criteria.map(c => c._id.toString());
  const scoredCriteriaIds = scores.map(s => s.criteria.toString());

  const missingCriteria = criteriaIds.filter(
    id => !scoredCriteriaIds.includes(id)
  );

  if (missingCriteria.length > 0 && finalStatus === "submitted") {
    throw new apiError(
      400,
      "All criteria must be scored before submitting evaluation"
    );
  }

  // Validate individual scores
  const validatedScores = [];

  for (const scoreItem of scores) {
    const criterion = criteria.find(
      c => c._id.toString() === scoreItem.criteria.toString()
    );

    if (!criterion) {
      throw new apiError(
        400,
        `Invalid criteria ID: ${scoreItem.criteria}`
      );
    }

    if (
      typeof scoreItem.score !== "number" ||
      scoreItem.score < 0 ||
      scoreItem.score > criterion.maxScore
    ) {
      throw new apiError(
        400,
        `Score for "${criterion.name}" must be between 0 and ${criterion.maxScore}`
      );
    }

    validatedScores.push({
      criteria: criterion._id,
      score: scoreItem.score,
      maxScore: criterion.maxScore,
      weight: criterion.weight,
      comments: scoreItem.comments || ""
    });
  }

  // Create or update evaluation
  let evaluation = await Evaluation.findOne({
    submission: submissionId,
    judge: req.user._id
  });

  let isCreated = false;

  if (evaluation) {
    // Update existing evaluation
    evaluation.scores = validatedScores;
    evaluation.feedback = feedback ?? evaluation.feedback;
    evaluation.strengths = strengths ?? evaluation.strengths;
    evaluation.improvements = improvements ?? evaluation.improvements;
    evaluation.status = finalStatus;
    evaluation.evaluatedAt = new Date();

    await evaluation.save();
  } else {
    // Create new evaluation
    evaluation = await Evaluation.create({
      submission: submissionId,
      judge: req.user._id,
      round: submission.round._id,
      scores: validatedScores,
      feedback: feedback || "",
      strengths: strengths || [],
      improvements: improvements || [],
      status: finalStatus,
      evaluatedAt: new Date()
    });

    isCreated = true;

    submission.evaluations.push(evaluation._id);
    submission.evaluationStatus = "in_progress";
    await submission.save();
  }

  // Check if all judges have completed evaluation
  const totalJudges = hackathon.judges.length;

  const completedEvaluations = await Evaluation.countDocuments({
    submission: submissionId,
    status: "submitted"
  });

  if (completedEvaluations === totalJudges) {
    // This method calculates average + sets evaluationStatus
    await submission.calculateAverageScore();
  }

  // Populate response
  await evaluation.populate([
    { path: "judge", select: "name email" },
    { path: "submission", select: "title team" },
    { path: "scores.criteria", select: "name description weight maxScore" }
  ]);

  return res.status(isCreated ? 201 : 200).json(
    new ApiResponse(
      isCreated ? 201 : 200,
      evaluation,
      isCreated
        ? "Evaluation created successfully"
        : "Evaluation updated successfully"
    )
  );
});





// Get evaluation by ID
export const getEvaluationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Evaluation ID is required");
  }

  const evaluation = await Evaluation.findById(id)
    .populate("judge", "name email")
    .populate({
      path: "submission",
      select: "title description team",
      populate: { path: "team", select: "name" }
    })
    .populate("round", "name roundNumber")
    .populate("scores.criteria", "name description weight maxScore");

  if (!evaluation) {
    throw new apiError(404, "Evaluation not found");
  }

  return res.status(200).json(
    new ApiResponse(200, evaluation, "Evaluation fetched successfully")
  );
});

// Get all evaluations for a submission
export const getEvaluationsBySubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  if (!submissionId) {
    throw new apiError(400, "Submission ID is required");
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new apiError(404, "Submission not found");
  }

  const evaluations = await Evaluation.find({ submission: submissionId })
    .populate("judge", "name email")
    .populate("scores.criteria", "name description weight maxScore")
    .sort({ evaluatedAt: -1 });

  // Calculate average scores
  const averageStats = await Evaluation.getAverageForSubmission(submissionId);

  return res.status(200).json(
    new ApiResponse(200, {
      evaluations,
      statistics: averageStats
    }, "Evaluations fetched successfully")
  );
});

// Get all evaluations by a judge for a round
export const getEvaluationsByJudgeAndRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  const judgeId = req.user._id;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(roundId).populate("hackathon");
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  // Verify user is a judge for this hackathon
  const hackathon = await Hackathon.findById(round.hackathon._id);
  if (!hackathon.judges.some(j => j.toString() === judgeId.toString())) {
    throw new apiError(403, "You are not assigned as a judge for this hackathon");
  }

  const evaluations = await Evaluation.find({
    round: roundId,
    judge: judgeId
  })
    .populate({
      path: "submission",
      select: "title team submittedAt",
      populate: { path: "team", select: "name" }
    })
    .populate("scores.criteria", "name weight maxScore")
    .sort({ evaluatedAt: -1 });

  // Get pending submissions (not yet evaluated by this judge)
  const allSubmissions = await Submission.find({ round: roundId }).select("_id");
  const evaluatedSubmissionIds = evaluations.map(e => e.submission._id.toString());
  const pendingSubmissionIds = allSubmissions
    .filter(s => !evaluatedSubmissionIds.includes(s._id.toString()))
    .map(s => s._id);

  const pendingSubmissions = await Submission.find({
    _id: { $in: pendingSubmissionIds }
  })
    .populate("team", "name")
    .select("title team submittedAt");

  return res.status(200).json(
    new ApiResponse(200, {
      evaluations,
      pendingSubmissions,
      stats: {
        total: allSubmissions.length,
        evaluated: evaluations.length,
        pending: pendingSubmissions.length
      }
    }, "Judge evaluations fetched successfully")
  );
});

// Get all evaluations for a round (organizer/admin view)
export const getEvaluationsByRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(roundId).populate("hackathon");
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  // Check if user is organizer or admin
  const hackathon = await Hackathon.findById(round.hackathon._id).populate("organizer");
  const isOrganizer = hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can view all evaluations");
  }

  const evaluations = await Evaluation.find({ round: roundId })
    .populate("judge", "name email")
    .populate({
      path: "submission",
      select: "title team averageScore",
      populate: { path: "team", select: "name" }
    })
    .populate("scores.criteria", "name weight maxScore")
    .sort({ "submission.team": 1, evaluatedAt: -1 });

  // Get evaluation progress stats
  const submissions = await Submission.find({ round: roundId });
  const totalJudges = hackathon.judges.length;
  const totalExpectedEvaluations = submissions.length * totalJudges;
  const completedEvaluations = await Evaluation.countDocuments({
    round: roundId,
    status: "submitted"
  });

  return res.status(200).json(
    new ApiResponse(200, {
      evaluations,
      statistics: {
        totalSubmissions: submissions.length,
        totalJudges,
        totalExpectedEvaluations,
        completedEvaluations,
        progress: totalExpectedEvaluations > 0 
          ? ((completedEvaluations / totalExpectedEvaluations) * 100).toFixed(2) 
          : 0
      }
    }, "Round evaluations fetched successfully")
  );
});

// Delete evaluation (before final submission only)
export const deleteEvaluation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "Evaluation ID is required");
  }

  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    throw new apiError(404, "Evaluation not found");
  }

  // Only the judge who created it or admin can delete
  const isJudge = evaluation.judge.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isJudge && !isAdmin) {
    throw new apiError(403, "You don't have permission to delete this evaluation");
  }

  // Remove evaluation from submission
  await Submission.findByIdAndUpdate(evaluation.submission, {
    $pull: { evaluations: evaluation._id }
  });

  // Delete the evaluation
  await Evaluation.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, "Evaluation deleted successfully")
  );
});

// Get evaluation summary for a hackathon
export const getHackathonEvaluationSummary = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!hackathonId) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(hackathonId)
    .populate("organizer", "name email")
    .populate("judges", "name email")
    .populate("rounds", "name roundNumber");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check authorization
  const isOrganizer = hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can view evaluation summary");
  }

  // Get round-wise evaluation stats
  const roundStats = [];
  for (const round of hackathon.rounds) {
    const submissions = await Submission.countDocuments({ round: round._id });
    const evaluations = await Evaluation.countDocuments({ round: round._id, status: "submitted" });
    const expectedEvaluations = submissions * hackathon.judges.length;

    roundStats.push({
      roundId: round._id,
      roundName: round.name,
      roundNumber: round.roundNumber,
      totalSubmissions: submissions,
      completedEvaluations: evaluations,
      expectedEvaluations,
      progress: expectedEvaluations > 0 
        ? ((evaluations / expectedEvaluations) * 100).toFixed(2) 
        : 0
    });
  }

  // Get judge-wise evaluation stats
  const judgeStats = [];
  for (const judge of hackathon.judges) {
    const totalSubmissions = await Submission.countDocuments({ 
      hackathon: hackathonId 
    });
    const completedEvaluations = await Evaluation.countDocuments({
      judge: judge._id,
      status: "submitted"
    });

    judgeStats.push({
      judgeId: judge._id,
      judgeName: judge.name,
      judgeEmail: judge.email,
      totalAssigned: totalSubmissions,
      completed: completedEvaluations,
      pending: totalSubmissions - completedEvaluations,
      progress: totalSubmissions > 0 
        ? ((completedEvaluations / totalSubmissions) * 100).toFixed(2) 
        : 0
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      hackathon: {
        id: hackathon._id,
        title: hackathon.title,
        totalJudges: hackathon.judges.length,
        totalRounds: hackathon.rounds.length
      },
      roundStats,
      judgeStats
    }, "Evaluation summary fetched successfully")
  );
});