const express = require("express");

const User = require("../models/User");
const CopyTrading = require("../models/CopyTrading");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// GET DASHBOARD
// GET /api/dashboard
// ======================================================

router.get("/", authMiddleware, async (req, res) => {
  try {

    const userId = req.user._id;


    // --------------------------------------------------
    // USER
    // --------------------------------------------------

    const user = await User.findById(userId).select(
      "name email balance"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    // --------------------------------------------------
    // ACTIVE COPY TRADES
    // --------------------------------------------------

    const activeCopyTrades = await CopyTrading.find({
      user: userId,
      status: "active"
    })
      .populate(
        "trader",
        "name username profitPercentage winRate riskLevel"
      )
      .sort({
        createdAt: -1
      });


    // --------------------------------------------------
    // TOTAL INVESTED
    // --------------------------------------------------

    const totalInvested = activeCopyTrades.reduce(
      (total, copy) => {
        return total + Number(copy.amount || 0);
      },
      0
    );


    // --------------------------------------------------
    // RECENT TRANSACTIONS
    // --------------------------------------------------

    const recentTransactions =
      await Transaction.find({
        user: userId
      })
        .sort({
          createdAt: -1
        })
        .limit(10);


    // --------------------------------------------------
    // RECENT NOTIFICATIONS
    // --------------------------------------------------

    const recentNotifications =
      await Notification.find({
        user: userId
      })
        .sort({
          createdAt: -1
        })
        .limit(10);


    // --------------------------------------------------
    // UNREAD NOTIFICATIONS
    // --------------------------------------------------

    const unreadNotifications =
      await Notification.countDocuments({
        user: userId,
        isRead: false
      });


    // --------------------------------------------------
    // PORTFOLIO VALUE
    // --------------------------------------------------

    const portfolioValue = totalInvested;


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.json({

      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },

      currency: "USD",

      balance: Number(user.balance),

      portfolio: {
        totalInvested,
        totalProfitLoss: 0,
        portfolioValue
      },

      activeCopyTrades: {
        count: activeCopyTrades.length,
        items: activeCopyTrades
      },

      recentTransactions,

      recentNotifications,

      unreadNotifications

    });

  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );

    res.status(500).json({
      message: "Unable to load dashboard"
    });

  }
});


module.exports = router;