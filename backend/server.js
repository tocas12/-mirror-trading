
require("dotenv").config();

const dns = require("dns");

// Use public DNS servers for MongoDB Atlas SRV resolution
dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
]);

console.log(
  "MONGODB_URI exists:",
  !!process.env.MONGODB_URI
);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const traderRoutes = require("./routes/traders");
const copyTradingRoutes = require("./routes/copyTrading");
const portfolioRoutes = require("./routes/portfolio");
const transactionRoutes = require("./routes/transactions");
const notificationRoutes = require("./routes/notifications");
const dashboardRoutes = require("./routes/dashboard");
const walletRoutes = require("./routes/wallet");
const adminRoutes = require("./routes/admin");

const app = express();

const PORT = process.env.PORT || 5000;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());


// ======================================================
// AUTHENTICATION ROUTES
// ======================================================

app.use(
  "/api/auth",
  authRoutes
);


// ======================================================
// TRADER ROUTES
// ======================================================

app.use(
  "/api/traders",
  traderRoutes
);


// ======================================================
// COPY TRADING ROUTES
// ======================================================

app.use(
  "/api/copy-trading",
  copyTradingRoutes
);


// ======================================================
// PORTFOLIO ROUTES
// ======================================================

app.use(
  "/api/portfolio",
  portfolioRoutes
);


// ======================================================
// TRANSACTION ROUTES
// ======================================================

app.use(
  "/api/transactions",
  transactionRoutes
);


// ======================================================
// NOTIFICATION ROUTES
// ======================================================

app.use(
  "/api/notifications",
  notificationRoutes
);


// ======================================================
// DASHBOARD ROUTES
// ======================================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);


// ======================================================
// WALLET ROUTES
// ======================================================

app.use(
  "/api/wallet",
  walletRoutes
);


// ======================================================
// ADMIN ROUTES
// ======================================================

app.use(
  "/api/admin",
  adminRoutes
);


// ======================================================
// HEALTH / TEST ROUTE
// ======================================================

app.get("/", (req, res) => {

  res.json({
    message: "Mirror Trading backend is running"
  });

});


// ======================================================
// MONGODB CONNECTION
// ======================================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {

    console.log(
      "MongoDB connected successfully"
    );

  })
  .catch((error) => {

    console.error(
      "MongoDB connection failed:",
      error.message
    );

  });


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "Mirror Trading server running on port " + PORT
    );

  }
);

