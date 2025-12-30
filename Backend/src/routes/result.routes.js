import express from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  calculateRoundResults,
  calculateOverallResults,
  getRoundResults,
  getOverallResults,
  getTeamRoundResult,
  publishResults,
  unpublishResults,
  deleteRoundResults,
  updateResultDetails
} from "../controllers/result.controllers.js";

const router = express.Router();

// Calculate results (organizer/admin only)
router.post("/calculate/round/:roundId", VerifyJWT, allowRoles("organizer", "admin"), calculateRoundResults);
router.post("/calculate/overall/:hackathonId", VerifyJWT, allowRoles("organizer", "admin"), calculateOverallResults);

// Get results (public if published, organizer/admin can see unpublished)
router.get("/round/:roundId", getRoundResults);
router.get("/overall/:hackathonId", getOverallResults);
router.get("/team/:teamId/round/:roundId", VerifyJWT, getTeamRoundResult);

// Publish/unpublish results (organizer/admin only)
router.post("/publish/:hackathonId", VerifyJWT, allowRoles("organizer", "admin"), publishResults);
router.post("/unpublish/:hackathonId", VerifyJWT, allowRoles("organizer", "admin"), unpublishResults);

// Update result details like prize, remarks (organizer/admin only)
router.post("/update/:id", VerifyJWT, allowRoles("organizer", "admin"), updateResultDetails);

// Delete round results (organizer/admin only)
router.delete("/round/:roundId", VerifyJWT, allowRoles("organizer", "admin"), deleteRoundResults);

export default router;