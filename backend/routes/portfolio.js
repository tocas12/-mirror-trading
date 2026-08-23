const express = require("express");
const Portfolio = require("../models/Portfolio");
const CopyTrading = require("../models/CopyTrading");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// GET MY PORTFOLIO
// GET /api/portfolio
// ======================================================

router.get("/", authMiddleware, async (req, res) => {
  try {

    const copies = await CopyTrading.find({
      user: req.user._id,
      status: "active"
    }).populate(
      "trader",
      "name username profitPercentage winRate riskLevel"
    );


    // Calculate total amount currently invested
    const totalInvested = copies.reduce(
      (total, copy) => total + Number(copy.amount || 0),
      0
    );


    // Calculate total simulated profit/loss
    const totalProfitLoss = copies.reduce(
      (total, copy) => total + Number(copy.profitLoss || 0),
      0
    );


    // Current portfolio value
    const portfolioValue =
      totalInvested + totalProfitLoss;


    // Save/update portfolio
    let portfolio = await Portfolio.findOne({
      user: req.user._id
    });


    if (!portfolio) {

      portfolio = await Portfolio.create({
        user: req.user._id,
        totalInvested,
        totalProfitLoss,
        portfolioValue
      });

    } else {

      portfolio.totalInvested = totalInvested;
      portfolio.totalProfitLoss = totalProfitLoss;
      portfolio.portfolioValue = portfolioValue;

      await portfolio.save();

    }


    res.json({

      balance: req.user.balance,

      portfolio: {
        totalInvested,
        totalProfitLoss,
        portfolioValue
      },

      activeCopyTrades: copies

    });

  } catch (error) {

    console.error("PORTFOLIO ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve portfolio"
    });

  }
});


// ======================================================
// PORTFOLIO SUMMARY
// GET /api/portfolio/summary
// ======================================================

router.get("/summary", authMiddleware, async (req, res) => {

  try {

    const copies = await CopyTrading.find({
      user: req.user._id,
      status: "active"
    });


    const totalInvested = copies.reduce(
      (total, copy) => total + Number(copy.amount || 0),
      0
    );


    const totalProfitLoss = copies.reduce(
      (total, copy) => total + Number(copy.profitLoss || 0),
      0
    );


    const portfolioValue =
      totalInvested + totalProfitLoss;


    res.json({

      balance: req.user.balance,

      totalInvested,

      totalProfitLoss,

      portfolioValue,

      activeCopyTrades: copies.length

    });

  } catch (error) {

    console.error(
      "PORTFOLIO SUMMARY ERROR:",
      error
    );

    res.status(500).json({
      message: "Unable to retrieve portfolio summary"
    });

  }

});


module.exports = router;