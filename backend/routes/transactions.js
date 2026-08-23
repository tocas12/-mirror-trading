const express = require("express");

const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// GET TRANSACTION HISTORY
// GET /api/transactions
// ======================================================

router.get("/", authMiddleware, async (req, res) => {
  try {

    const transactions = await Transaction.find({
      user: req.user._id
    })
      .sort({
        createdAt: -1
      });

    res.json({
      count: transactions.length,
      transactions
    });

  } catch (error) {

    console.error(
      "TRANSACTION HISTORY ERROR:",
      error
    );

    res.status(500).json({
      message: "Unable to retrieve transactions"
    });

  }
});


// ======================================================
// CREATE TRANSACTION
// POST /api/transactions
// ======================================================

router.post("/", authMiddleware, async (req, res) => {

  try {

    const {
      type,
      amount,
      description
    } = req.body;


    if (!type || !amount) {

      return res.status(400).json({
        message: "Transaction type and amount are required"
      });

    }


    const allowedTypes = [
      "deposit",
      "withdrawal",
      "copy_trade",
      "profit",
      "loss"
    ];


    if (!allowedTypes.includes(type)) {

      return res.status(400).json({
        message: "Invalid transaction type"
      });

    }


    if (Number(amount) <= 0) {

      return res.status(400).json({
        message: "Amount must be greater than zero"
      });

    }


    const transaction = await Transaction.create({

      user: req.user._id,

      type,

      amount: Number(amount),

      description:
        description || `${type} transaction`,

      status: "completed"

    });


    res.status(201).json({

      message: "Transaction created successfully",

      transaction

    });

  } catch (error) {

    console.error(
      "CREATE TRANSACTION ERROR:",
      error
    );

    res.status(500).json({
      message: "Unable to create transaction"
    });

  }

});


module.exports = router;