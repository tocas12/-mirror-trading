const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    totalInvested: {
      type: Number,
      default: 0,
      min: 0
    },

    totalProfitLoss: {
      type: Number,
      default: 0
    },

    portfolioValue: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);