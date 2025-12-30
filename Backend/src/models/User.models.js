import mongoose from "mongoose"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv"
dotenv.config()
import Team from "./Team.model.js"
import Hackathon from "./Hackathon.model.js"
import Submission from "./Submission.model.js"
import Round from "./Round.model.js"
import Result from "./Result.model.js"
import Evaluation from "./Evaluations.model.js"
import Criteria from "./Criteria.Schema.js"


const UserSchema = new mongoose.Schema({
    name : {
        type : String , 
        required : [true , "name is requried"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email : {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address"
      ]
    },
    password : {
        type : String , 
        required : [true , "password is required"] ,
    },
    role : {
        type : String , 
        enum : ["participant" , "judge", "organizer" , "admin"],
        default : "participant"
    },
    hackathonsJoined: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hackathon"
      }
    ],
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
      }
    ],

}, {timestamps : true});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "7d" }
  );
  return token 
};

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

const User = mongoose.model("User", UserSchema);

export default User ;