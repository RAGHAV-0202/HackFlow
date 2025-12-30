import express from "express"
import {UserLogin , UserRegister,UserLogout,UserRefreshAccessToken , UserPasswordResetRequest , UserPasswordResetPage , isLoggedIn} from "../controllers/auth.controllers.js"
import {VerifyJWT} from "../middlewares/auth.middleware.js"
const router = express.Router()


router.route("/register").post(UserRegister)
router.route("/login").post(UserLogin)
router.route("/logout").post(UserLogout)
router.route("/refreshAT").post(UserRefreshAccessToken)
router.route("/reset-password-request").post(UserPasswordResetRequest)
router.route("/reset-password/:token").post(UserPasswordResetPage)
router.route("/isLoggedIn").get(isLoggedIn)



export default router