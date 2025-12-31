import express from "express"
import {create , getAll , getParticular , updateHackathon , deleteHackathon , joinHackathon , assignJudge , removeJudge , addRounds , updateRound , deleteRound , allJudges ,   getJudgeSubmissions, getJudgeRoundSubmissions, getJudgeHackathonSubmissions , judgeInHackathons} from "../controllers/hackathons.controllers.js"
const router = express.Router();
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { isJudge , isAdmin , isOrganizer , allowRoles } from "../middlewares/role.middleware.js";
import { verifyJWT } from "../../../../Backend/video/src/middlewares/auth.middleware.js";



router.route("/create").post(VerifyJWT , allowRoles("admin" , "organizer") , create)
router.route("/add-round/:id").post(VerifyJWT , allowRoles("admin" , "organizer") , addRounds)
router.route("/update-round/:id").post(VerifyJWT , allowRoles("admin" , "organizer") , updateRound)
router.route("/delete-round/:id").post(VerifyJWT , allowRoles("admin" , "organizer") , deleteRound)

router.route("/").get(getAll)
router.route("/:id").get(getParticular)

router.route("/update/:id").post(VerifyJWT , allowRoles("admin" , "organizer") , updateHackathon)
router.route("/delete/:id").post(VerifyJWT , allowRoles("admin" , "organizer") , deleteHackathon)

router.route("/join/:id").post(VerifyJWT , allowRoles("participant") , joinHackathon)

router.route("/get-judges").post(VerifyJWT , allowRoles("admin" , "organizer") , allJudges)
router.route("/assign-judge/:id").post(VerifyJWT , allowRoles("admin" , "organizer") , assignJudge)
router.route("/remove-judge/:id").post(VerifyJWT , allowRoles("admin" , "organizer") , removeJudge)

router.route("/judge/submissions").get(VerifyJWT, allowRoles("judge"), getJudgeSubmissions);
router.route("/judge/:hackathonId/submissions").get(VerifyJWT, allowRoles("judge"), getJudgeHackathonSubmissions);
router.route("/judge/round/:roundId/submissions").get(VerifyJWT, allowRoles("judge"), getJudgeRoundSubmissions);

router.route("/judge/hackathons").get(verifyJWT , allowRoles("organizer" , "admin") , judgeInHackathons)

export default router ;