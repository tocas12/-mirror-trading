const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "transfer",
        "copy_trade",
        "profit",
        "loss"
      ],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "completed",
        "pending",
        "failed"
      ],
      default: "completed"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);