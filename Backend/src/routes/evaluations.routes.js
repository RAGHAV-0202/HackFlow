import express from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  evaluateSubmission,
  getEvaluationById,
  getEvaluationsBySubmission,
  getEvaluationsByJudgeAndRound,
  getEvaluationsByRound,
  deleteEvaluation,
  getHackathonEvaluationSummary
} from "../controllers/evaluation.controllers.js";

const router = express.Router();

// Create or update evaluation for a submission (judges only)
router.post("/evaluate/:submissionId", VerifyJWT, allowRoles("judge"), evaluateSubmission);

// Get single evaluation by ID
router.get("/:id", VerifyJWT, getEvaluationById);

// Get all evaluations for a submission (organizers, admins, team members can see after published)
router.get("/submission/:submissionId", VerifyJWT, getEvaluationsBySubmission);

// Get all evaluations by current judge for a round (judges only)
router.get("/judge/round/:roundId", VerifyJWT, allowRoles("judge"), getEvaluationsByJudgeAndRound);

// Get all evaluations for a round (organizer/admin only)
router.get("/round/:roundId", VerifyJWT, allowRoles("organizer", "admin"), getEvaluationsByRound);

// Get evaluation summary for entire hackathon (organizer/admin only)
router.get("/hackathon/:hackathonId/summary", VerifyJWT, allowRoles("organizer", "admin"), getHackathonEvaluationSummary);

// Delete evaluation (judge or admin only)
router.delete("/:id", VerifyJWT, deleteEvaluation);

export default router;