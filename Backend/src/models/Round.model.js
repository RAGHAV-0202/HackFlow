import mongoose from "mongoose";
import Criteria from "./Criteria.Schema.js";

const RoundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Round name is required"],
      trim: true,
      minlength: [2, "Round name must be at least 2 characters long"],
      maxlength: [100, "Round name cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: [true, "Hackathon reference is required"]
    },
    roundNumber: {
      type: Number,
      required: [true, "Round number is required"],
      min: [1, "Round number must be at least 1"]
    },
    submissionType: {
      type: String,
      enum: {
        values: ["ppt", "video", "github", "live_demo", "screenshot", "document", "multiple"],
        message: "{VALUE} is not a valid submission type"
      },
      required: [true, "Submission type is required"]
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: "End date must be after start date"
      }
    },
    maxMarks: {
      type: Number,
      required: [true, "Maximum marks is required"],
      min: [1, "Maximum marks must be at least 1"],
      default: 100
    },
    criteria: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Criteria"
      }
    ],
    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission"
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    allowLateSubmissions: {
      type: Boolean,
      default: false
    },
    lateSubmissionDeadline: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return value > this.endDate;
        },
        message: "Late submission deadline must be after end date"
      }
    },
    instructions: {
      type: String,
      maxlength: [2000, "Instructions cannot exceed 2000 characters"]
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming"
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index to ensure unique round numbers per hackathon
RoundSchema.index({ hackathon: 1, roundNumber: 1 }, { unique: true });
RoundSchema.index({ hackathon: 1, status: 1 });
RoundSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if submissions are currently accepted
RoundSchema.virtual("isSubmissionOpen").get(function() {
  const now = new Date();
  if (now < this.startDate) return false;
  if (now <= this.endDate) return true;
  if (this.allowLateSubmissions && this.lateSubmissionDeadline && now <= this.lateSubmissionDeadline) {
    return true;
  }
  return false;
});

// Method to check if a team can submit
RoundSchema.methods.canSubmit = function() {
  return this.isActive || this.isSubmissionOpen;
};

const Round = mongoose.model("Round", RoundSchema);

export default Round;