import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      minlength: [2, "Team name must be at least 2 characters long"],
      maxlength: [50, "Team name cannot exceed 50 characters"]
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: [true, "Hackathon reference is required"]
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team leader is required"]
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    invitedMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        email: {  // ✅ ADD THIS FIELD
          type: String,
          lowercase: true,
          trim: true
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending"
        },
        invitedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission"
      }
    ],
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    projectName: {
      type: String,
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"]
    },
    projectDescription: {
      type: String,
      trim: true,
      maxlength: [1000, "Project description cannot exceed 1000 characters"]
    },
    technologies: [
      {
        type: String,
        trim: true
      }
    ],
    logo: {
      type: String, // URL to team logo/avatar
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    totalScore: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true 
  }
);

TeamSchema.index({ hackathon: 1, name: 1 }, { unique: true });
TeamSchema.index({ hackathon: 1 });
TeamSchema.index({ leader: 1 });

TeamSchema.virtual("allMembers").get(function() {
  return [this.leader, ...this.members];
});

TeamSchema.virtual("teamSize").get(function() {
  return this.members.length + 1; 
});


TeamSchema.methods.addMember = async function(userId, hackathon) {
  if (this.leader.toString() === userId.toString()) {
    throw new Error("User is already the team leader");
  }
  
  if (this.members.some(member => member.toString() === userId.toString())) {
    throw new Error("User is already a team member");
  }

  const currentSize = this.members.length + 1; // +1 for leader
  if (currentSize >= hackathon.maxTeamSize) {
    throw new Error(`Team size cannot exceed ${hackathon.maxTeamSize}`);
  }

  this.members.push(userId);
  return await this.save();
};

TeamSchema.methods.removeMember = async function(userId) {
  if (this.leader.toString() === userId.toString()) {
    throw new Error("Cannot remove team leader. Transfer leadership first.");
  }

  const memberIndex = this.members.findIndex(
    member => member.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new Error("User is not a team member");
  }

  this.members.splice(memberIndex, 1);
  return await this.save();
};

TeamSchema.methods.hasMember = function(userId) {
  if (this.leader.toString() === userId.toString()) return true;
  return this.members.some(member => member.toString() === userId.toString());
};

const Team = mongoose.model("Team", TeamSchema);

export default Team;