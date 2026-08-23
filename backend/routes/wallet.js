const express = require("express");

const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Deposit amount must be greater than zero"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.balance = Number(user.balance) + amount;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: "deposit",
      amount: amount,
      description: "Deposit of $" + amount.toFixed(2),
      status: "completed"
    });

    await Notification.create({
      user: user._id,
      title: "Deposit Successful",
      message: "$" + amount.toFixed(2) + " has been added to your account balance.",
      type: "transaction",
      isRead: false
    });

    res.status(201).json({
      message: "Deposit completed successfully",
      amount: amount,
      balance: user.balance
    });

  } catch (error) {
    console.error("DEPOSIT ERROR:", error);

    res.status(500).json({
      message: "Unable to process deposit"
    });
  }
});


router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Withdrawal amount must be greater than zero"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (Number(user.balance) < amount) {
      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    user.balance = Number(user.balance) - amount;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: "withdrawal",
      amount: amount,
      description: "Withdrawal of $" + amount.toFixed(2),
      status: "completed"
    });

    await Notification.create({
      user: user._id,
      title: "Withdrawal Successful",
      message: "$" + amount.toFixed(2) + " has been withdrawn from your account.",
      type: "transaction",
      isRead: false
    });

    res.json({
      message: "Withdrawal completed successfully",
      amount: amount,
      balance: user.balance
    });

  } catch (error) {
    console.error("WITHDRAWAL ERROR:", error);

    res.status(500).json({
      message: "Unable to process withdrawal"
    });
  }
});


router.post("/transfer", authMiddleware, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const amount = Number(req.body.amount);

    if (!email || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Recipient email and valid amount are required"
      });
    }

    const sender = await User.findById(req.user._id);

    if (!sender) {
      return res.status(404).json({
        message: "Sender account not found"
      });
    }

    const recipient = await User.findOne({
      email: email
    });

    if (!recipient) {
      return res.status(404).json({
        message: "Recipient account not found"
      });
    }

    if (sender._id.toString() === recipient._id.toString()) {
      return res.status(400).json({
        message: "You cannot transfer money to yourself"
      });
    }

    if (Number(sender.balance) < amount) {
      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    sender.balance = Number(sender.balance) - amount;
    recipient.balance = Number(recipient.balance) + amount;

    await sender.save();
    await recipient.save();

    await Transaction.create({
      user: sender._id,
      type: "transfer",
      amount: amount,
      description: "Transfer to " + recipient.name,
      status: "completed"
    });

    await Transaction.create({
      user: recipient._id,
      type: "transfer",
      amount: amount,
      description: "Transfer received from " + sender.name,
      status: "completed"
    });

    await Notification.create({
      user: sender._id,
      title: "Transfer Successful",
      message: "$" + amount.toFixed(2) + " was transferred to " + recipient.name + ".",
      type: "transaction",
      isRead: false
    });

    await Notification.create({
      user: recipient._id,
      title: "Transfer Received",
      message: "$" + amount.toFixed(2) + " was received from " + sender.name + ".",
      type: "transaction",
      isRead: false
    });

    res.status(201).json({
      message: "Transfer completed successfully",
      amount: amount,
      recipient: {
        name: recipient.name,
        email: recipient.email
      },
      balance: sender.balance
    });

  } catch (error) {
    console.error("TRANSFER ERROR:", error);

    res.status(500).json({
      message: "Unable to process transfer"
    });
  }
});


module.exports = router;
