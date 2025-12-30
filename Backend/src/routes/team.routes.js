import express from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { isJudge , isAdmin , isOrganizer , allowRoles } from "../middlewares/role.middleware.js";
import {
  createTeam,
  getTeamsByHackathon,
  getTeamById,
  updateTeam,
  deleteTeam,
  inviteMemberToTeam,
  removeMemberFromTeam,
  leaveTeam,
  acceptTeamInvite
} from "../controllers/team.controllers.js";

const router = express.Router();


router.post("/create/:hackathonId", VerifyJWT, allowRoles("participant"), createTeam);  // checked
router.get("/hackathon/:hackathonId", VerifyJWT, getTeamsByHackathon); // checked

router.get("/:id", VerifyJWT, getTeamById);  // checked
router.post("/update/:id", VerifyJWT, updateTeam); 
router.post("/delete/:id", VerifyJWT, deleteTeam);
router.post("/:id/invite-member", VerifyJWT, inviteMemberToTeam); // checked 
router.post("/:id/accept", VerifyJWT, acceptTeamInvite);  // checked
router.post("/:id/remove-member", VerifyJWT, removeMemberFromTeam);
router.post("/:id/leave", VerifyJWT, leaveTeam);

export default router;
