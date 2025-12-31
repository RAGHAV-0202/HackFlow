import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import helmet from "helmet";
import getStats from "./utils/getStats.js"
import asyncHandler from "./utils/asyncHandler.js"
import ApiResponse from "./utils/apiResponse.js"
import apiError from "./utils/apiError.js"
dotenv.config()
// Router
import AuthRouter from "./routes/auth.routes.js"
import UserRouter from "./routes/user.routes.js"
import HackathonRouter from "./routes/hackathons.routes.js"
import TeamRouter from "./routes/team.routes.js"
import SubmissionRouter from "./routes/submission.routes.js";
import EvaluationRouter from "./routes/evaluations.routes.js";
import ResultRouter from "./routes/result.routes.js";


const app = express();
app.set('trust proxy' , 1 );
app.use(express.json({limit : "100kb"}))
app.use(cookieParser())
app.use(helmet())


const corsOptions = {
    origin: ['http://localhost:8080' , "https://lovable.dev" , "https://lovableproject.com" , "https://id-preview--4a6f51c3-95b2-4aa9-97c2-c06c19193efe.lovable.app"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true ,
    sameSite: 'None'
};

app.use(cors(corsOptions));

app.get(/\/.*\/status$/, asyncHandler(async (req, res) => {
  const statusInfo = await getStats()
  res.status(200).json(statusInfo);
}));

app.get("/" , async(req,res)=>{
  const statusInfo = await getStats()
  res.status(200).json(new ApiResponse(200 , statusInfo , "Server is live"))
})

app.use("/api/auth" , AuthRouter)
app.use("/api/user" , UserRouter)
app.use("/api/hackathon" , HackathonRouter)
app.use("/api/teams" , TeamRouter)
app.use("/api/submissions" , SubmissionRouter)
app.use("/api/evaluations" , EvaluationRouter)
app.use("/api/results" , ResultRouter)



app.use((req, res) => {
  res.status(404).send(`
    <body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; min-width: 100vw; box-sizing: border-box">
      <h1>Resource not found <br> Status Code 404</h1>
    </body>
  `);
});

export {app}