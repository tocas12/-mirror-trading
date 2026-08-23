const express = require("express");

const CopyTrading = require("../models/CopyTrading");
const Trader = require("../models/Trader");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// START COPYING A TRADER
// POST /api/copy-trading
// ======================================================

router.post("/", authMiddleware, async (req, res) => {
  try {

    const { traderId, amount } = req.body;

    const copyAmount = Number(amount);


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!traderId || !amount) {
      return res.status(400).json({
        message: "Trader ID and amount are required"
      });
    }

    if (!Number.isFinite(copyAmount) || copyAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero"
      });
    }


    // --------------------------------------------------
    // FIND TRADER
    // --------------------------------------------------

    const trader = await Trader.findById(traderId);

    if (!trader || !trader.isActive) {
      return res.status(404).json({
        message: "Trader not found"
      });
    }


    // --------------------------------------------------
    // CHECK EXISTING COPY
    // --------------------------------------------------

    const existingCopy = await CopyTrading.findOne({
      user: req.user._id,
      trader: traderId,
      status: "active"
    });

    if (existingCopy) {
      return res.status(409).json({
        message: "You are already copying this trader"
      });
    }


    // --------------------------------------------------
    // CHECK USER BALANCE
    // --------------------------------------------------

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User account not found"
      });
    }

    if (Number(user.balance) < copyAmount) {
      return res.status(400).json({
        message: "Insufficient balance"
      });
    }


    // --------------------------------------------------
    // DEDUCT COPY AMOUNT
    // --------------------------------------------------

    user.balance = Number(user.balance) - copyAmount;

    await user.save();


    // --------------------------------------------------
    // CREATE COPY TRADE
    // --------------------------------------------------

    const copy = await CopyTrading.create({
      user: req.user._id,
      trader: traderId,
      amount: copyAmount,
      status: "active"
    });


    // --------------------------------------------------
    // CREATE TRANSACTION
    // --------------------------------------------------

    await Transaction.create({
      user: req.user._id,
      type: "copy_trade",
      amount: copyAmount,
      description:
        `Copy trading allocation to ${trader.name}`,
      status: "completed"
    });


    // --------------------------------------------------
    // CREATE NOTIFICATION
    // --------------------------------------------------

    await Notification.create({
      user: req.user._id,
      title: "Copy Trading Started",
      message:
        `You are now copying ${trader.name} with $${copyAmount.toFixed(2)}.`,
      type: "copy_trade",
      isRead: false
    });


    // --------------------------------------------------
    // GET POPULATED COPY
    // --------------------------------------------------

    const populatedCopy =
      await CopyTrading.findById(copy._id)
        .populate(
          "trader",
          "name username profitPercentage winRate riskLevel"
        );


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.status(201).json({

      message: "Copy trading started successfully",

      copyTrading: populatedCopy,

      balance: user.balance,

      transaction: {
        type: "copy_trade",
        amount: copyAmount,
        status: "completed"
      },

      notification: {
        title: "Copy Trading Started",
        message:
          `You are now copying ${trader.name} with $${copyAmount.toFixed(2)}.`
      }

    });

  } catch (error) {

    console.error("START COPY ERROR:", error);

    res.status(500).json({
      message: "Unable to start copy trading"
    });

  }
});


// ======================================================
// GET MY COPIED TRADERS
// GET /api/copy-trading
// ======================================================

router.get("/", authMiddleware, async (req, res) => {

  try {

    const copies = await CopyTrading.find({
      user: req.user._id
    })
      .populate(
        "trader",
        "name username profitPercentage winRate riskLevel"
      )
      .sort({
        createdAt: -1
      });


    res.json({

      count: copies.length,

      copyTrading: copies

    });

  } catch (error) {

    console.error(
      "GET COPY TRADING ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Unable to retrieve copy trading records"
    });

  }

});


// ======================================================
// STOP COPYING
// DELETE /api/copy-trading/:id
// ======================================================

router.delete("/:id", authMiddleware, async (req, res) => {

  try {

    const copy = await CopyTrading.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "active"
    }).populate(
      "trader",
      "name username"
    );


    if (!copy) {

      return res.status(404).json({
        message:
          "Active copy trading record not found"
      });

    }


    const user = await User.findById(
      req.user._id
    );


    if (!user) {

      return res.status(404).json({
        message: "User account not found"
      });

    }


    // --------------------------------------------------
    // RETURN ALLOCATED FUNDS
    // --------------------------------------------------

    const returnedAmount =
      Number(copy.amount || 0);

    user.balance =
      Number(user.balance) + returnedAmount;

    await user.save();


    // --------------------------------------------------
    // STOP COPY
    // --------------------------------------------------

    copy.status = "stopped";

    await copy.save();


    // --------------------------------------------------
    // CREATE TRANSACTION
    // --------------------------------------------------

    await Transaction.create({

      user: req.user._id,

      type: "withdrawal",

      amount: returnedAmount,

      description:
        `Funds returned from ${copy.trader.name} copy trade`,

      status: "completed"

    });


    // --------------------------------------------------
    // CREATE NOTIFICATION
    // --------------------------------------------------

    await Notification.create({

      user: req.user._id,

      title: "Copy Trading Stopped",

      message:
        `Copy trading with ${copy.trader.name} has been stopped. $${returnedAmount.toFixed(2)} was returned to your balance.`,

      type: "copy_trade",

      isRead: false

    });


    res.json({

      message:
        "Copy trading stopped successfully",

      returnedAmount,

      balance: user.balance

    });

  } catch (error) {

    console.error(
      "STOP COPY ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Unable to stop copy trading"
    });

  }

});


module.exports = router;