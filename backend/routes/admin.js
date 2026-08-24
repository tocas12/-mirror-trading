```javascript
const express = require("express");

const User = require("../models/User");
const Trader = require("../models/Trader");
const Transaction = require("../models/Transaction");
const CopyTrading = require("../models/CopyTrading");
const Notification = require("../models/Notification");

const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();


// ======================================================
// ADMIN AUTH CHECK
// GET /api/admin/check
// ======================================================

router.get("/check", adminMiddleware, (req, res) => {
  res.json({
    message: "Admin authentication works",
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});


// ======================================================
// ADMIN SUMMARY
// GET /api/admin/summary
// ======================================================

router.get("/summary", adminMiddleware, async (req, res) => {
  try {
    const users = await User.countDocuments();

    const activeTraders = await Trader.countDocuments({
      isActive: true
    });

    const transactions = await Transaction.countDocuments();

    const activeCopyTrades = await CopyTrading.countDocuments({
      status: "active"
    });

    const usersWithBalances = await User.find()
      .select("balance");

    const totalBalances = usersWithBalances.reduce(
      (total, user) => total + Number(user.balance || 0),
      0
    );

    res.json({
      users,
      activeTraders,
      transactions,
      activeCopyTrades,
      totalBalances
    });

  } catch (error) {
    console.error("ADMIN SUMMARY ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve admin summary"
    });
  }
});


// ======================================================
// GET ALL USERS
// GET /api/admin/users
// ======================================================

router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      count: users.length,
      users
    });

  } catch (error) {
    console.error("ADMIN USERS ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve users"
    });
  }
});


// ======================================================
// UPDATE USER BALANCE
// PATCH /api/admin/users/:id/balance
// ======================================================

router.patch(
  "/users/:id/balance",
  adminMiddleware,
  async (req, res) => {
    try {
      const amount = Number(req.body.balance);

      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({
          message:
            "Balance must be a valid number greater than or equal to zero"
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      user.balance = amount;

      await user.save();

      res.json({
        message: "User balance updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          balance: user.balance,
          role: user.role
        }
      });

    } catch (error) {
      console.error(
        "ADMIN BALANCE UPDATE ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to update user balance"
      });
    }
  }
);


// ======================================================
// GET ALL TRADERS
// GET /api/admin/traders
// ======================================================

router.get("/traders", adminMiddleware, async (req, res) => {
  try {
    const traders = await Trader.find()
      .sort({ profitPercentage: -1 });

    res.json({
      count: traders.length,
      traders
    });

  } catch (error) {
    console.error("ADMIN TRADERS ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve traders"
    });
  }
});


// ======================================================
// UPDATE TRADER
// PATCH /api/admin/traders/:id
// ======================================================

router.patch(
  "/traders/:id",
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        username,
        profitPercentage,
        winRate,
        riskLevel
      } = req.body;

      const trader = await Trader.findById(req.params.id);

      if (!trader) {
        return res.status(404).json({
          message: "Trader not found"
        });
      }

      if (name !== undefined) {
        trader.name = String(name).trim();
      }

      if (username !== undefined) {
        trader.username = String(username).trim();
      }

      if (profitPercentage !== undefined) {
        const value = Number(profitPercentage);

        if (!Number.isFinite(value)) {
          return res.status(400).json({
            message: "Invalid profit percentage"
          });
        }

        trader.profitPercentage = value;
      }

      if (winRate !== undefined) {
        const value = Number(winRate);

        if (
          !Number.isFinite(value) ||
          value < 0 ||
          value > 100
        ) {
          return res.status(400).json({
            message: "Win rate must be between 0 and 100"
          });
        }

        trader.winRate = value;
      }

      if (riskLevel !== undefined) {
        trader.riskLevel = String(riskLevel).trim();
      }

      await trader.save();

      res.json({
        message: "Trader updated successfully",
        trader
      });

    } catch (error) {
      console.error(
        "ADMIN UPDATE TRADER ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to update trader"
      });
    }
  }
);


// ======================================================
// ACTIVATE / DEACTIVATE TRADER
// PATCH /api/admin/traders/:id/status
// ======================================================

router.patch(
  "/traders/:id/status",
  adminMiddleware,
  async (req, res) => {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive must be true or false"
        });
      }

      const trader = await Trader.findById(req.params.id);

      if (!trader) {
        return res.status(404).json({
          message: "Trader not found"
        });
      }

      trader.isActive = isActive;

      await trader.save();

      res.json({
        message: isActive
          ? "Trader activated successfully"
          : "Trader deactivated successfully",
        trader
      });

    } catch (error) {
      console.error(
        "ADMIN TRADER STATUS ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to update trader status"
      });
    }
  }
);


// ======================================================
// GET ALL COPY TRADES
// GET /api/admin/copy-trades
// ======================================================

router.get(
  "/copy-trades",
  adminMiddleware,
  async (req, res) => {
    try {
      const copyTrades = await CopyTrading.find()
        .sort({ createdAt: -1 });

      res.json({
        count: copyTrades.length,
        copyTrades
      });

    } catch (error) {
      console.error(
        "ADMIN COPY TRADES ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to retrieve copy trades"
      });
    }
  }
);


// ======================================================
// GET PENDING DEPOSITS
// GET /api/admin/deposits/pending
// ======================================================

router.get(
  "/deposits/pending",
  adminMiddleware,
  async (req, res) => {
    try {
      const deposits = await Transaction.find({
        type: "deposit",
        status: "pending"
      })
        .populate("user", "name email balance")
        .sort({ createdAt: -1 });

      res.json({
        count: deposits.length,
        deposits
      });

    } catch (error) {
      console.error(
        "ADMIN PENDING DEPOSITS ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to retrieve pending deposits"
      });
    }
  }
);


// ======================================================
// APPROVE DEPOSIT
// PATCH /api/admin/deposits/:id/approve
// ======================================================

router.patch(
  "/deposits/:id/approve",
  adminMiddleware,
  async (req, res) => {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        type: "deposit",
        status: "pending"
      });

      if (!transaction) {
        return res.status(404).json({
          message: "Pending deposit not found"
        });
      }

      const user = await User.findById(transaction.user);

      if (!user) {
        return res.status(404).json({
          message: "User associated with deposit not found"
        });
      }

      user.balance =
        Number(user.balance || 0) +
        Number(transaction.amount);

      await user.save();

      transaction.status = "completed";

      transaction.description =
        transaction.description +
        " - Approved by admin";

      await transaction.save();

      await Notification.create({
        user: user._id,
        title: "Deposit Approved",
        message:
          "$" +
          Number(transaction.amount).toFixed(2) +
          " has been added to your account balance.",
        type: "transaction",
        isRead: false
      });

      res.json({
        message: "Deposit approved successfully",
        transactionId: transaction._id,
        amount: transaction.amount,
        balance: user.balance,
        status: transaction.status
      });

    } catch (error) {
      console.error(
        "ADMIN APPROVE DEPOSIT ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to approve deposit"
      });
    }
  }
);


// ======================================================
// REJECT DEPOSIT
// PATCH /api/admin/deposits/:id/reject
// ======================================================

router.patch(
  "/deposits/:id/reject",
  adminMiddleware,
  async (req, res) => {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        type: "deposit",
        status: "pending"
      });

      if (!transaction) {
        return res.status(404).json({
          message: "Pending deposit not found"
        });
      }

      transaction.status = "failed";

      transaction.description =
        transaction.description +
        " - Rejected by admin";

      await transaction.save();

      await Notification.create({
        user: transaction.user,
        title: "Deposit Rejected",
        message:
          "$" +
          Number(transaction.amount).toFixed(2) +
          " deposit request was rejected.",
        type: "transaction",
        isRead: false
      });

      res.json({
        message: "Deposit rejected successfully",
        transactionId: transaction._id,
        status: transaction.status
      });

    } catch (error) {
      console.error(
        "ADMIN REJECT DEPOSIT ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to reject deposit"
      });
    }
  }
);


// ======================================================
// GET ALL TRANSACTIONS
// GET /api/admin/transactions
// ======================================================

router.get(
  "/transactions",
  adminMiddleware,
  async (req, res) => {
    try {
      const transactions = await Transaction.find()
        .sort({ createdAt: -1 });

      res.json({
        count: transactions.length,
        transactions
      });

    } catch (error) {
      console.error(
        "ADMIN TRANSACTIONS ERROR:",
        error
      );

      res.status(500).json({
        message: "Unable to retrieve transactions"
      });
    }
  }
);


module.exports = router;
```
