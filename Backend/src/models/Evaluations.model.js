import mongoose from "mongoose";

const EvaluationSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: [true, "Submission reference is required"]
    },
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Judge reference is required"]
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: [true, "Round reference is required"]
    },
    scores: [
      {
        criteria: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Criteria",
          required: true
        },
        score: {
          type: Number,
          required: [true, "Score is required"],
          min: [0, "Score cannot be negative"]
        },
        maxScore: {
          type: Number,
          required: true
        },
        weight: {
          type: Number,
          required: true
        },
        comments: {
          type: String,
          maxlength: [500, "Comments cannot exceed 500 characters"]
        }
      }
    ],
    totalScore: {
      type: Number,
      default: 0
    },
    weightedScore: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      maxlength: [2000, "Feedback cannot exceed 2000 characters"]
    },
    strengths: [
      {
        type: String,
        maxlength: [200, "Each strength cannot exceed 200 characters"]
      }
    ],
    improvements: [
      {
        type: String,
        maxlength: [200, "Each improvement suggestion cannot exceed 200 characters"]
      }
    ],
    evaluatedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "submitted"
    },
    isComplete: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index to ensure one evaluation per judge per submission
EvaluationSchema.index({ submission: 1, judge: 1 }, { unique: true });
EvaluationSchema.index({ round: 1 });
EvaluationSchema.index({ judge: 1 });
EvaluationSchema.index({ submission: 1 });

// Pre-save hook to calculate total and weighted scores
EvaluationSchema.pre("save", function(next) {
  if (this.scores && this.scores.length > 0) {
    // Calculate total score (sum of all scores)
    this.totalScore = this.scores.reduce((sum, scoreItem) => {
      return sum + scoreItem.score;
    }, 0);

    // Calculate weighted score
    this.weightedScore = this.scores.reduce((sum, scoreItem) => {
      const weightedValue = (scoreItem.score / scoreItem.maxScore) * scoreItem.weight;
      return sum + weightedValue;
    }, 0);

    // Check if evaluation is complete (all criteria scored)
    this.isComplete = this.scores.every(scoreItem => 
      scoreItem.score !== undefined && scoreItem.score !== null
    );
  }
  
  next();
});

// Method to add or update score for a criterion
EvaluationSchema.methods.addScore = async function(criteriaId, score, maxScore, weight, comments = "") {
  const existingScoreIndex = this.scores.findIndex(
    s => s.criteria.toString() === criteriaId.toString()
  );

  const scoreData = {
    criteria: criteriaId,
    score: score,
    maxScore: maxScore,
    weight: weight,
    comments: comments
  };

  if (existingScoreIndex !== -1) {
    // Update existing score
    this.scores[existingScoreIndex] = scoreData;
  } else {
    // Add new score
    this.scores.push(scoreData);
  }

  return await this.save();
};

// Method to validate all scores are within max limits
EvaluationSchema.methods.validateScores = function() {
  for (const scoreItem of this.scores) {
    if (scoreItem.score > scoreItem.maxScore) {
      throw new Error(
        `Score ${scoreItem.score} exceeds maximum score ${scoreItem.maxScore} for criteria`
      );
    }
  }
  return true;
};

// Static method to get average evaluation for a submission
EvaluationSchema.statics.getAverageForSubmission = async function(submissionId) {
  const evaluations = await this.find({ submission: submissionId, status: "submitted" });
  
  if (evaluations.length === 0) {
    return {
      averageTotalScore: 0,
      averageWeightedScore: 0,
      evaluationCount: 0
    };
  }

  const totalSum = evaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0);
  const weightedSum = evaluations.reduce((sum, evaluation) => sum + evaluation.weightedScore, 0);

  return {
    averageTotalScore: totalSum / evaluations.length,
    averageWeightedScore: weightedSum / evaluations.length,
    evaluationCount: evaluations.length
  };
};

const Evaluation = mongoose.model("Evaluation", EvaluationSchema);

export default Evaluation;