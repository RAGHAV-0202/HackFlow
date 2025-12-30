import mongoose from "mongoose";

const CriteriaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Criteria name is required"],
      trim: true,
      minlength: [2, "Criteria name must be at least 2 characters long"],
      maxlength: [100, "Criteria name cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: [true, "Round reference is required"]
    },
    weight: {
      type: Number,
      required: [true, "Weight/weightage is required"],
      min: [0, "Weight cannot be negative"],
      max: [100, "Weight cannot exceed 100"],
      default: 10
    },
    maxScore: {
      type: Number,
      required: [true, "Maximum score is required"],
      min: [1, "Maximum score must be at least 1"],
      default: 10
    },
    order: {
      type: Number,
      default: 0,
      min: [0, "Order cannot be negative"]
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes
CriteriaSchema.index({ round: 1 });
CriteriaSchema.index({ round: 1, order: 1 });

// Static method to validate total weight for a round
CriteriaSchema.statics.validateTotalWeight = async function(roundId) {
  const criteria = await this.find({ round: roundId });
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  return totalWeight <= 100;
};

const Criteria = mongoose.model("Criteria", CriteriaSchema);

export default Criteria;