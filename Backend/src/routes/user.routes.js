import express from "express"
import {me , getAllusers , getUser , deleteUser , updateRole} from "../controllers/user.controllers.js"
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { isJudge , isAdmin , isOrganizer } from "../middlewares/role.middleware.js";
const router = express.Router();

router.route("/").get(VerifyJWT , me)
router.route("/all-users").get(VerifyJWT , isAdmin, getAllusers)
router.route("/get-user/:id").get(VerifyJWT, getUser)
router.route("/del-user/:id").post(VerifyJWT , isAdmin , deleteUser)
router.route("/update-role/:id").post(VerifyJWT , isAdmin , updateRole)

export default router ;