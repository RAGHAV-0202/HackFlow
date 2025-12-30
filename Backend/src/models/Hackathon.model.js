import mongoose from "mongoose"
import Criteria from "./Criteria.Schema.js";


const HackathonSchema = new mongoose.Schema({
    title : {
        type : String , 
        required : [true , "hackathon title is required !!!"],
        trim : true ,
        minlength: [3, "Title must be at least 3 characters long"],
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description : {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    startDate : {
        type : Date , 
        required : [true , "Star date is required"]
    },
    endDate : {
        type: Date,
        required: [true, "End date is required"],
        validate: {
            validator: function(value) {
            return value > this.startDate;
            },
            message: "End date must be after start date"
        }
    },
    maxTeamSize : {
        type : Number , 
        min : [1 , "Minimum team size is 1 "],
        default : 1
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"]
    },
    judges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    rounds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Round"
    }],
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    }],
    maxParticipants: {type: Number,
      min: [1, "Maximum participants must be at least 1"],
      default: null // null means unlimited
    },
    prizes: [{
        position: {
          type: String,
          required: true
        },
        reward: {
          type: String,
          required: true
        }
    }],
    banner : {
        type : String , 
        default : null
    },
    status : {
        type : String , 
        enum : ["upcoming" , "ongoing" , "completed" , "cancelled"],
        default  : "upcoming"
    },
    registrationOpen: {
      type: Boolean,
      default: true
    },
    registrationDeadline: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          return value <= this.startDate;
        },
        message: "Registration deadline must be before or on start date"
      }
    },
    visibility : {
      type : String , 
      enum : ['visible' , 'hidden'],
      default : 'hidden'
    }

} , {timestamps : true})

HackathonSchema.index({ organizer: 1 });
HackathonSchema.index({ status: 1 });
HackathonSchema.index({ startDate: 1 });
HackathonSchema.index({ registrationOpen: 1 });

HackathonSchema.virtual("isRegistrationOpen").get(function() {
  if (!this.registrationOpen) return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  if (this.maxParticipants && this.participants.length >= this.maxParticipants) return false;
  return true;
});

HackathonSchema.methods.addParticipant = async function(userId) {
  if (!this.isRegistrationOpen) {
    throw new Error("Registration is closed");
  }
  if (this.participants.includes(userId)) {
    throw new Error("User already registered");
  }
  this.participants.push(userId);
  return await this.save();
};

HackathonSchema.methods.addTeamParticipants = async function(team) {
  if (!this.isRegistrationOpen) {
    throw new Error("Registration is closed");
  }
  if (this.teams.some(t => t.toString() === team._id.toString())) {
    throw new Error("Team already registered for this hackathon");
  }

  if (team.teamSize > this.maxTeamSize) {
    throw new Error(`Team exceeds max team size of ${this.maxTeamSize}`);
  }
  for (const memberId of team.allMembers) {
    if (!this.participants.some(p => p.toString() === memberId.toString())) {
      this.participants.push(memberId);
    }
  }
  this.teams.push(team._id);
  return await this.save();
};


HackathonSchema.methods.addJudge = async function(userId) {
  if (this.judges.includes(userId)) {
    throw new Error("Judge already assigned");
  }
  this.judges.push(userId);
  return await this.save();
};

const Hackathon = mongoose.model("Hackathon", HackathonSchema);

export default Hackathon;