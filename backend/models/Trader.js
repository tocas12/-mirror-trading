const mongoose = require("mongoose");

const traderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    avatar: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: ""
    },

    profitPercentage: {
      type: Number,
      default: 0
    },

    winRate: {
      type: Number,
      default: 0
    },

    totalTrades: {
      type: Number,
      default: 0
    },

    followers: {
      type: Number,
      default: 0
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    assets: {
      type: [String],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Trader", traderSchema);