import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: [true, "Hackathon reference is required"]
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: false // null for overall hackathon results
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team reference is required"]
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: false // null for overall results
    },
    totalScore: {
      type: Number,
      required: [true, "Total score is required"],
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    weightedScore: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number,
      min: [1, "Rank must be at least 1"]
    },
    // Round-wise breakdown
    roundScores: [
      {
        round: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Round"
        },
        score: Number,
        rank: Number
      }
    ],
    // Detailed evaluation breakdown
    evaluationBreakdown: [
      {
        judge: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        score: Number,
        weightedScore: Number
      }
    ],
    // Criteria-wise breakdown
    criteriaBreakdown: [
      {
        criteria: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Criteria"
        },
        averageScore: Number,
        maxScore: Number,
        weight: Number
      }
    ],
    prize: {
      type: String,
      default: null
    },
    resultType: {
      type: String,
      enum: ["round", "overall"],
      required: [true, "Result type is required"]
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date
    },
    remarks: {
      type: String,
      maxlength: [500, "Remarks cannot exceed 500 characters"]
    }
  },
  { 
    timestamps: true 
  }
);

// Compound indexes
ResultSchema.index({ hackathon: 1, round: 1, team: 1 }, { unique: true });
ResultSchema.index({ hackathon: 1, resultType: 1 });
ResultSchema.index({ hackathon: 1, rank: 1 });
ResultSchema.index({ round: 1, rank: 1 });
ResultSchema.index({ team: 1 });

// Static method to calculate and store round results
ResultSchema.statics.calculateRoundResults = async function(roundId) {
  const Submission = mongoose.model("Submission");
  const Round = mongoose.model("Round");
  
  const round = await Round.findById(roundId).populate("hackathon");
  if (!round) throw new Error("Round not found");

  const submissions = await Submission.find({ round: roundId })
    .populate("team")
    .populate("evaluations");

  // Calculate scores for each submission
  const results = [];
  for (const submission of submissions) {
    await submission.calculateAverageScore();
    
    results.push({
      team: submission.team._id,
      submission: submission._id,
      totalScore: submission.totalScore,
      averageScore: submission.averageScore
    });
  }

  // Sort by average score descending
  results.sort((a, b) => b.averageScore - a.averageScore);

  // Assign ranks and save results
  for (let i = 0; i < results.length; i++) {
    const resultData = results[i];
    
    await this.findOneAndUpdate(
      {
        hackathon: round.hackathon._id,
        round: roundId,
        team: resultData.team
      },
      {
        submission: resultData.submission,
        totalScore: resultData.totalScore,
        averageScore: resultData.averageScore,
        rank: i + 1,
        resultType: "round"
      },
      { upsert: true, new: true }
    );
  }

  return results;
};

// Static method to calculate overall hackathon results
ResultSchema.statics.calculateOverallResults = async function(hackathonId) {
  const Team = mongoose.model("Team");
  const Round = mongoose.model("Round");
  
  const rounds = await Round.find({ hackathon: hackathonId });
  const teams = await Team.find({ hackathon: hackathonId });

  const teamScores = [];

  for (const team of teams) {
    let totalScore = 0;
    const roundScores = [];

    for (const round of rounds) {
      const roundResult = await this.findOne({
        hackathon: hackathonId,
        round: round._id,
        team: team._id,
        resultType: "round"
      });

      if (roundResult) {
        totalScore += roundResult.averageScore;
        roundScores.push({
          round: round._id,
          score: roundResult.averageScore,
          rank: roundResult.rank
        });
      }
    }

    teamScores.push({
      team: team._id,
      totalScore,
      averageScore: rounds.length > 0 ? totalScore / rounds.length : 0,
      roundScores
    });
  }

  // Sort by total score descending
  teamScores.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks and save overall results
  for (let i = 0; i < teamScores.length; i++) {
    const teamData = teamScores[i];
    
    await this.findOneAndUpdate(
      {
        hackathon: hackathonId,
        round: null,
        team: teamData.team,
        resultType: "overall"
      },
      {
        totalScore: teamData.totalScore,
        averageScore: teamData.averageScore,
        rank: i + 1,
        roundScores: teamData.roundScores
      },
      { upsert: true, new: true }
    );
  }

  return teamScores;
};

// Method to publish results
ResultSchema.methods.publish = async function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  return await this.save();
};

// Static method to publish all results for a round or hackathon
ResultSchema.statics.publishResults = async function(hackathonId, roundId = null) {
  const query = { hackathon: hackathonId };
  if (roundId) {
    query.round = roundId;
    query.resultType = "round";
  } else {
    query.resultType = "overall";
  }

  await this.updateMany(
    query,
    {
      isPublished: true,
      publishedAt: new Date()
    }
  );
};

const Result = mongoose.model("Result", ResultSchema);

export default Result;