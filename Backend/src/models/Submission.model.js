import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team reference is required"]
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: [true, "Round reference is required"]
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: [true, "Hackathon reference is required"]
    },
    title: {
      type: String,
      required: [true, "Submission title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    submissionType: {
      type: String,
      enum: ["ppt", "video", "github", "live_demo", "screenshot", "document", "multiple"],
      required: [true, "Submission type is required"]
    },
    // Type-specific fields
    pptUrl: {
      type: String,
      validate: {
        validator: function(v) {
          if (this.submissionType === "ppt" || this.submissionType === "multiple") {
            return !!v;
          }
          return true;
        },
        message: "PPT URL is required for PPT submissions"
      }
    },
    videoUrl: {
      type: String,
      validate: {
        validator: function(v) {
          if (this.submissionType === "video" || this.submissionType === "multiple") {
            return !!v;
          }
          return true;
        },
        message: "Video URL is required for video submissions"
      }
    },
    githubUrl: {
      type: String,
      validate: {
        validator: function(v) {
          if (this.submissionType === "github" || this.submissionType === "multiple") {
            return !!v;
          }
          return true;
        },
        message: "GitHub URL is required for GitHub submissions"
      }
    },
    liveDemoUrl: {
      type: String,
      validate: {
        validator: function(v) {
          if (this.submissionType === "live_demo" || this.submissionType === "multiple") {
            return !!v;
          }
          return true;
        },
        message: "Live demo URL is required for live demo submissions"
      }
    },
    screenshots: [
      {
        type: String // URLs to screenshots
      }
    ],
    documentUrl: {
      type: String
    },
    additionalLinks: [
      {
        title: String,
        url: String
      }
    ],
    technologies: [
      {
        type: String,
        trim: true
      }
    ],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submitter reference is required"]
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    isLateSubmission: {
      type: Boolean,
      default: false
    },
    // Evaluation data
    evaluations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Evaluation"
      }
    ],
    totalScore: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    evaluationStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending"
    },
    feedback: {
      type: String,
      maxlength: [2000, "Feedback cannot exceed 2000 characters"]
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "evaluated"],
      default: "submitted"
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index to ensure one submission per team per round
SubmissionSchema.index({ team: 1, round: 1 }, { unique: true });
SubmissionSchema.index({ round: 1 });
SubmissionSchema.index({ hackathon: 1 });
SubmissionSchema.index({ team: 1 });
SubmissionSchema.index({ evaluationStatus: 1 });

// Method to calculate average score from evaluations
SubmissionSchema.methods.calculateAverageScore = async function() {
  await this.populate("evaluations");
  
  if (!this.evaluations || this.evaluations.length === 0) {
    this.averageScore = 0;
    this.totalScore = 0;
    return this.averageScore;
  }

  const totalScore = this.evaluations.reduce((sum, evaluation) => {
    return sum + (evaluation.totalScore || 0);
  }, 0);

  this.totalScore = totalScore;
  this.averageScore = totalScore / this.evaluations.length;
  
  // Update evaluation status
  this.evaluationStatus = "completed";
  
  await this.save();
  return this.averageScore;
};

// Method to check if submission is complete
SubmissionSchema.methods.isComplete = function() {
  switch (this.submissionType) {
    case "ppt":
      return !!this.pptUrl;
    case "video":
      return !!this.videoUrl;
    case "github":
      return !!this.githubUrl;
    case "live_demo":
      return !!this.liveDemoUrl;
    case "screenshot":
      return this.screenshots && this.screenshots.length > 0;
    case "document":
      return !!this.documentUrl;
    case "multiple":
      return !!this.pptUrl || !!this.videoUrl || !!this.githubUrl || !!this.liveDemoUrl;
    default:
      return false;
  }
};

const Submission = mongoose.model("Submission", SubmissionSchema);

export default Submission;