import express from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  createSubmission,
  getSubmissionsByRound,
  getSubmissionsByHackathon,
  getSubmissionsByTeam,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  getSubmissionStats
} from "../controllers/submission.controllers.js";

const router = express.Router();

// Create submission for a round
router.post("/create/:roundId", VerifyJWT, allowRoles("participant"), createSubmission);

// Get submissions by round (judges, organizers, admins)
router.get("/round/:roundId", VerifyJWT, allowRoles("judge", "organizer", "admin"), getSubmissionsByRound);

// Get submissions by hackathon (organizers, admins)
router.get("/hackathon/:hackathonId", VerifyJWT, allowRoles("organizer", "admin"), getSubmissionsByHackathon);

// Get submissions by team
router.get("/team/:teamId", VerifyJWT, getSubmissionsByTeam);

// Get single submission details
router.get("/:id", VerifyJWT, getSubmissionById);

// Update submission
router.post("/update/:id", VerifyJWT, allowRoles("participant"), updateSubmission);

// Delete submission
router.delete("/:id", VerifyJWT, deleteSubmission);

// Get submission statistics for a round
router.get("/stats/:roundId", VerifyJWT, allowRoles("organizer", "admin"), getSubmissionStats);

export default router;