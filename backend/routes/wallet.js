
const express = require("express");

const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// DEPOSIT METHODS
// GET /api/wallet/deposit-methods
// ======================================================

router.get("/deposit-methods", (req, res) => {
  const methods = [
    {
      id: "btc",
      currency: "BTC",
      network: "Bitcoin",
      address: process.env.BTC_DEPOSIT_ADDRESS || ""
    },
    {
      id: "usdt_trc20",
      currency: "USDT",
      network: "TRC20",
      address: process.env.USDT_TRC20_ADDRESS || ""
    },
    {
      id: "usdt_erc20",
      currency: "USDT",
      network: "ERC20",
      address: process.env.USDT_ERC20_ADDRESS || ""
    },
    {
      id: "usdt_bep20",
      currency: "USDT",
      network: "BEP20",
      address: process.env.USDT_BEP20_ADDRESS || ""
    }
  ];

  res.json({
    methods
  });
});


// ======================================================
// RECORD DEPOSIT REQUEST
// POST /api/wallet/deposit
// ======================================================
//
// For a real payment system, this should create a
// pending deposit request. Do NOT automatically credit
// the balance just because a client submits a request.
// The payment should be verified before the balance changes.
// ======================================================

router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const method = String(req.body.method || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Deposit amount must be greater than zero"
      });
    }

    if (!method) {
      return res.status(400).json({
        message: "Deposit method is required"
      });
    }

    const validMethods = [
      "btc",
      "usdt_trc20",
      "usdt_erc20",
      "usdt_bep20"
    ];

    if (!validMethods.includes(method)) {
      return res.status(400).json({
        message: "Invalid deposit method"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Create a pending transaction instead of immediately
    // adding funds to the user's balance.
    const transaction = await Transaction.create({
      user: user._id,
      type: "deposit",
      amount: amount,
      description: `Deposit request via ${method}`,
      status: "pending"
    });

    await Notification.create({
      user: user._id,
      title: "Deposit Submitted",
      message:
        `$${amount.toFixed(2)} deposit request submitted via ${method}. ` +
        "Your balance will be updated after verification.",
      type: "transaction",
      isRead: false
    });

    res.status(201).json({
      message: "Deposit request submitted",
      transactionId: transaction._id,
      status: "pending",
      balance: user.balance
    });

  } catch (error) {
    console.error("DEPOSIT ERROR:", error);

    res.status(500).json({
      message: "Unable to process deposit request"
    });
  }
});


// ======================================================
// WITHDRAW
// POST /api/wallet/withdraw
// ======================================================

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
      message:
        "$" + amount.toFixed(2) +
        " has been withdrawn from your account.",
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


// ======================================================
// TRANSFER
// POST /api/wallet/transfer
// ======================================================

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
      message:
        "$" + amount.toFixed(2) +
        " was transferred to " +
        recipient.name + ".",
      type: "transaction",
      isRead: false
    });

    await Notification.create({
      user: recipient._id,
      title: "Transfer Received",
      message:
        "$" + amount.toFixed(2) +
        " was received from " +
        sender.name + ".",
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
