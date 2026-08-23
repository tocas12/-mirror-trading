const express = require("express");
const Trader = require("../models/Trader");

const router = express.Router();


// ======================================================
// GET ALL TRADERS
// GET /api/traders
// ======================================================
router.get("/", async (req, res) => {
  try {
    const traders = await Trader.find({
      isActive: true
    }).sort({
      profitPercentage: -1
    });

    res.json({
      count: traders.length,
      traders
    });

  } catch (error) {
    console.error("GET TRADERS ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve traders"
    });
  }
});


// ======================================================
// GET TOP TRADERS
// GET /api/traders/top
// ======================================================
router.get("/top", async (req, res) => {
  try {
    const traders = await Trader.find({
      isActive: true
    })
      .sort({
        profitPercentage: -1
      })
      .limit(10);

    res.json({
      count: traders.length,
      traders
    });

  } catch (error) {
    console.error("GET TOP TRADERS ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve top traders"
    });
  }
});


// ======================================================
// GET SINGLE TRADER
// GET /api/traders/:id
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.id);

    if (!trader) {
      return res.status(404).json({
        message: "Trader not found"
      });
    }

    res.json({
      trader
    });

  } catch (error) {
    console.error("GET TRADER ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve trader"
    });
  }
});


module.exports = router;