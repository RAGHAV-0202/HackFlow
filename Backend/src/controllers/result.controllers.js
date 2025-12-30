import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Result from "../models/Result.model.js";
import Submission from "../models/Submission.model.js";
import Evaluation from "../models/Evaluations.model.js";
import Round from "../models/Round.model.js";
import Hackathon from "../models/Hackathon.model.js";
import Team from "../models/Team.model.js";
import Criteria from "../models/Criteria.Schema.js";
import mongoose from "mongoose";

// Calculate and save results for a specific round
export const calculateRoundResults = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(roundId).populate("hackathon");
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  // Check authorization - only organizer or admin
  const hackathon = await Hackathon.findById(round.hackathon._id).populate("organizer");
  const isOrganizer = hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can calculate results");
  }

  // Get all submissions for this round
  const submissions = await Submission.find({ round: roundId })
    .populate("team")
    .populate({
      path: "evaluations",
      populate: {
        path: "judge",
        select: "name email"
      }
    });

  if (submissions.length === 0) {
    throw new apiError(400, "No submissions found for this round");
  }

  // Check if all submissions are evaluated
  const unevaluatedSubmissions = submissions.filter(
    s => s.evaluationStatus !== "completed"
  );

  if (unevaluatedSubmissions.length > 0) {
    throw new apiError(400, 
      `${unevaluatedSubmissions.length} submission(s) are not fully evaluated yet`
    );
  }

  const results = [];

  // Calculate scores for each submission
  for (const submission of submissions) {
    // Recalculate average score
    await submission.calculateAverageScore();

    // Get detailed breakdown
    const evaluationBreakdown = submission.evaluations.map(evaluation => ({
      judge: evaluation.judge._id,
      score: evaluation.totalScore,
      weightedScore: evaluation.weightedScore
    }));

    // Get criteria-wise breakdown
    const criteriaMap = new Map();
    for (const evaluation of submission.evaluations) {
      for (const scoreItem of evaluation.scores) {
        const criteriaId = scoreItem.criteria.toString();
        if (!criteriaMap.has(criteriaId)) {
          criteriaMap.set(criteriaId, {
            criteria: scoreItem.criteria,
            scores: [],
            maxScore: scoreItem.maxScore,
            weight: scoreItem.weight
          });
        }
        criteriaMap.get(criteriaId).scores.push(scoreItem.score);
      }
    }

    const criteriaBreakdown = Array.from(criteriaMap.values()).map(item => ({
      criteria: item.criteria,
      averageScore: item.scores.reduce((a, b) => a + b, 0) / item.scores.length,
      maxScore: item.maxScore,
      weight: item.weight
    }));

    results.push({
      submission: submission._id,
      team: submission.team._id,
      totalScore: submission.totalScore,
      averageScore: submission.averageScore,
      evaluationBreakdown,
      criteriaBreakdown
    });
  }

  // Sort by average score (descending)
  results.sort((a, b) => b.averageScore - a.averageScore);

  // Save or update results with ranks
  const savedResults = [];
  for (let i = 0; i < results.length; i++) {
    const resultData = results[i];
    const rank = i + 1;

    const result = await Result.findOneAndUpdate(
      {
        hackathon: hackathon._id,
        round: roundId,
        team: resultData.team
      },
      {
        submission: resultData.submission,
        totalScore: resultData.totalScore,
        averageScore: resultData.averageScore,
        weightedScore: resultData.averageScore, // Can add custom weighting logic
        rank: rank,
        evaluationBreakdown: resultData.evaluationBreakdown,
        criteriaBreakdown: resultData.criteriaBreakdown,
        resultType: "round"
      },
      { upsert: true, new: true }
    ).populate([
      { path: "team", select: "name leader members projectName" },
      { path: "submission", select: "title" }
    ]);

    savedResults.push(result);
  }

  return res.status(200).json(
    new ApiResponse(200, savedResults, "Round results calculated successfully")
  );
});

// Calculate overall hackathon results (across all rounds)
export const calculateOverallResults = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!hackathonId) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(hackathonId)
    .populate("organizer")
    .populate("rounds")
    .populate("teams");

  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check authorization
  const isOrganizer = hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can calculate overall results");
  }

  // Check if all rounds have results
  for (const round of hackathon.rounds) {
    const roundResultsCount = await Result.countDocuments({
      hackathon: hackathonId,
      round: round._id,
      resultType: "round"
    });

    if (roundResultsCount === 0) {
      throw new apiError(400, 
        `Round "${round.name}" does not have calculated results yet`
      );
    }
  }

  const teamScores = [];

  // Calculate cumulative scores for each team
  for (const team of hackathon.teams) {
    let totalScore = 0;
    let totalWeightedScore = 0;
    const roundScores = [];

    for (const round of hackathon.rounds) {
      const roundResult = await Result.findOne({
        hackathon: hackathonId,
        round: round._id,
        team: team._id,
        resultType: "round"
      });

      if (roundResult) {
        totalScore += roundResult.totalScore;
        totalWeightedScore += roundResult.weightedScore || roundResult.averageScore;
        
        roundScores.push({
          round: round._id,
          score: roundResult.averageScore,
          rank: roundResult.rank
        });
      }
    }

    const averageScore = hackathon.rounds.length > 0 
      ? totalScore / hackathon.rounds.length 
      : 0;

    teamScores.push({
      team: team._id,
      totalScore,
      averageScore,
      weightedScore: totalWeightedScore,
      roundScores
    });
  }

  // Sort by weighted score (or total score)
  teamScores.sort((a, b) => b.weightedScore - a.weightedScore);

  // Save or update overall results
  const savedResults = [];
  for (let i = 0; i < teamScores.length; i++) {
    const teamData = teamScores[i];
    const rank = i + 1;

    const result = await Result.findOneAndUpdate(
      {
        hackathon: hackathonId,
        round: null,
        team: teamData.team,
        resultType: "overall"
      },
      {
        totalScore: teamData.totalScore,
        averageScore: teamData.averageScore,
        weightedScore: teamData.weightedScore,
        rank: rank,
        roundScores: teamData.roundScores,
        submission: null
      },
      { upsert: true, new: true }
    ).populate({
      path: "team",
      select: "name leader members projectName projectDescription"
    });

    savedResults.push(result);
  }

  return res.status(200).json(
    new ApiResponse(200, savedResults, "Overall results calculated successfully")
  );
});

// Get results for a specific round
export const getRoundResults = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  const { published } = req.query;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(roundId).populate("hackathon");
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  // Build query
  const query = {
    round: roundId,
    resultType: "round"
  };

  // If not organizer/admin, only show published results
  const hackathon = await Hackathon.findById(round.hackathon._id).populate("organizer");
  const isOrganizer = req.user && hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user && req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    query.isPublished = true;
  } else if (published === "true") {
    query.isPublished = true;
  } else if (published === "false") {
    query.isPublished = false;
  }

  const results = await Result.find(query)
    .populate({
      path: "team",
      select: "name leader members projectName",
      populate: { path: "leader members", select: "name email" }
    })
    .populate("submission", "title description technologies")
    .sort({ rank: 1 });

  return res.status(200).json(
    new ApiResponse(200, results, "Round results fetched successfully")
  );
});

// Get overall results for a hackathon
export const getOverallResults = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { published } = req.query;

  if (!hackathonId) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(hackathonId).populate("organizer");
  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Build query
  const query = {
    hackathon: hackathonId,
    round: null,
    resultType: "overall"
  };

  // Check authorization for unpublished results
  const isOrganizer = req.user && hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user && req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    query.isPublished = true;
  } else if (published === "true") {
    query.isPublished = true;
  } else if (published === "false") {
    query.isPublished = false;
  }

  const results = await Result.find(query)
    .populate({
      path: "team",
      select: "name leader members projectName projectDescription",
      populate: { path: "leader members", select: "name email" }
    })
    .populate({
      path: "roundScores.round",
      select: "name roundNumber"
    })
    .sort({ rank: 1 });

  return res.status(200).json(
    new ApiResponse(200, results, "Overall results fetched successfully")
  );
});

// Get result for a specific team in a round
export const getTeamRoundResult = asyncHandler(async (req, res) => {
  const { roundId, teamId } = req.params;

  if (!roundId || !teamId) {
    throw new apiError(400, "Round ID and Team ID are required");
  }

  const result = await Result.findOne({
    round: roundId,
    team: teamId,
    resultType: "round"
  })
    .populate("team", "name leader members projectName")
    .populate("submission", "title description")
    .populate({
      path: "evaluationBreakdown.judge",
      select: "name email"
    })
    .populate({
      path: "criteriaBreakdown.criteria",
      select: "name description weight maxScore"
    });

  if (!result) {
    throw new apiError(404, "Result not found for this team in this round");
  }

  // Check if published or user has access
  const round = await Round.findById(roundId).populate("hackathon");
  const hackathon = await Hackathon.findById(round.hackathon._id).populate("organizer");
  
  const isOrganizer = req.user && hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user && req.user.role === "admin";
  const isTeamMember = req.user && result.team.hasMember && result.team.hasMember(req.user._id);

  if (!result.isPublished && !isOrganizer && !isAdmin && !isTeamMember) {
    throw new apiError(403, "Results are not published yet");
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Team result fetched successfully")
  );
});

// Publish results for a round or entire hackathon
export const publishResults = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { roundId } = req.body;

  if (!hackathonId) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(hackathonId).populate("organizer");
  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check authorization
  const isOrganizer = hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can publish results");
  }

  let updateQuery;
  let message;

  if (roundId) {
    // Publish results for specific round
    const round = await Round.findById(roundId);
    if (!round) {
      throw new apiError(404, "Round not found");
    }

    updateQuery = {
      hackathon: hackathonId,
      round: roundId,
      resultType: "round"
    };
    message = `Results published for round: ${round.name}`;
  } else {
    // Publish overall results
    updateQuery = {
      hackathon: hackathonId,
      round: null,
      resultType: "overall"
    };
    message = "Overall results published successfully";
  }

  const updateResult = await Result.updateMany(
    updateQuery,
    {
      isPublished: true,
      publishedAt: new Date()
    }
  );

  return res.status(200).json(
    new ApiResponse(200, {
      modifiedCount: updateResult.modifiedCount
    }, message)
  );
});

// Unpublish results
export const unpublishResults = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { roundId } = req.body;

  if (!hackathonId) {
    throw new apiError(400, "Hackathon ID is required");
  }

  const hackathon = await Hackathon.findById(hackathonId).populate("organizer");
  if (!hackathon) {
    throw new apiError(404, "Hackathon not found");
  }

  // Check authorization
  const isOrganizer = hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can unpublish results");
  }

  let updateQuery;
  let message;

  if (roundId) {
    updateQuery = {
      hackathon: hackathonId,
      round: roundId,
      resultType: "round"
    };
    message = "Round results unpublished successfully";
  } else {
    updateQuery = {
      hackathon: hackathonId,
      round: null,
      resultType: "overall"
    };
    message = "Overall results unpublished successfully";
  }

  const updateResult = await Result.updateMany(
    updateQuery,
    {
      isPublished: false,
      publishedAt: null
    }
  );

  return res.status(200).json(
    new ApiResponse(200, {
      modifiedCount: updateResult.modifiedCount
    }, message)
  );
});

// Delete results for a round (recalculation needed)
export const deleteRoundResults = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  if (!roundId) {
    throw new apiError(400, "Round ID is required");
  }

  const round = await Round.findById(roundId).populate("hackathon");
  if (!round) {
    throw new apiError(404, "Round not found");
  }

  // Check authorization
  const hackathon = await Hackathon.findById(round.hackathon._id).populate("organizer");
  const isOrganizer = hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can delete results");
  }

  await Result.deleteMany({
    round: roundId,
    resultType: "round"
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Round results deleted successfully")
  );
});

// Add prize/remarks to a result
export const updateResultDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { prize, remarks } = req.body;

  if (!id) {
    throw new apiError(400, "Result ID is required");
  }

  const result = await Result.findById(id).populate({
    path: "hackathon",
    populate: { path: "organizer" }
  });

  if (!result) {
    throw new apiError(404, "Result not found");
  }

  // Check authorization
  const isOrganizer = result.hackathon.organizer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOrganizer && !isAdmin) {
    throw new apiError(403, "Only organizer or admin can update result details");
  }

  if (prize !== undefined) result.prize = prize;
  if (remarks !== undefined) result.remarks = remarks;

  await result.save();

  await result.populate([
    { path: "team", select: "name" },
    { path: "submission", select: "title" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, result, "Result details updated successfully")
  );
});