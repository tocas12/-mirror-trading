```js
const express = require("express");

const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// GET TRANSACTION HISTORY
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id
    }).sort({
      createdAt: -1
    });

    res.json({
      count: transactions.length,
      transactions: transactions
    });

  } catch (error) {
    console.error("TRANSACTION HISTORY ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve transactions"
    });
  }
});


// GET DEPOSIT WALLET ADDRESSES
router.get("/deposit-wallets", authMiddleware, (req, res) => {
  res.json({
    wallets: {
      BTC: process.env.BTC_DEPOSIT_ADDRESS || "",
      USDT_TRC20: process.env.USDT_TRC20_ADDRESS || "",
      USDT_ERC20: process.env.USDT_ERC20_ADDRESS || "",
      USDT_BEP20: process.env.USDT_BEP20_ADDRESS || ""
    }
  });
});


// CREATE TRANSACTION
router.post("/", authMiddleware, async (req, res) => {
  try {

    const type = req.body.type;
    const amount = Number(req.body.amount);
    const description = req.body.description;

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

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero"
      });
    }

    const transactionDescription =
      description || type + " transaction";

    const transaction = await Transaction.create({
      user: req.user._id,
      type: type,
      amount: amount,
      description: transactionDescription,
      status: "completed"
    });

    res.status(201).json({
      message: "Transaction created successfully",
      transaction: transaction
    });

  } catch (error) {

    console.error("CREATE TRANSACTION ERROR:", error);

    res.status(500).json({
      message: "Unable to create transaction"
    });
  }
});


module.exports = router;
```
