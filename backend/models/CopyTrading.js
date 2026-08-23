const mongoose = require("mongoose");

const copyTradingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    trader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

    status: {
      type: String,
      enum: ["active", "stopped"],
      default: "active"
    },

    profitLoss: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "CopyTrading",
  copyTradingSchema
);