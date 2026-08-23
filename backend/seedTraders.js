require("dotenv").config();

const dns = require("dns");

// Use public DNS servers for MongoDB Atlas SRV resolution
dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
]);

const mongoose = require("mongoose");
const Trader = require("./models/Trader");

const traders = [
  {
    name: "Alex Morgan",
    username: "alex_morgan",
    bio: "Experienced simulated portfolio trader focused on diversified strategies.",
    profitPercentage: 38.5,
    winRate: 87,
    totalTrades: 342,
    followers: 1240,
    riskLevel: "Medium",
    assets: ["BTC", "ETH", "SOL"],
    isActive: true
  },

  {
    name: "David Carter",
    username: "david_carter",
    bio: "Conservative simulated trader focused on steady portfolio growth.",
    profitPercentage: 31.2,
    winRate: 82,
    totalTrades: 287,
    followers: 986,
    riskLevel: "Low",
    assets: ["BTC", "ETH"],
    isActive: true
  },

  {
    name: "Sophia Wilson",
    username: "sophia_wilson",
    bio: "Balanced simulated strategy with emphasis on risk management.",
    profitPercentage: 27.8,
    winRate: 79,
    totalTrades: 264,
    followers: 875,
    riskLevel: "Medium",
    assets: ["ETH", "SOL", "XRP"],
    isActive: true
  },

  {
    name: "James Anderson",
    username: "james_anderson",
    bio: "Aggressive simulated strategy targeting higher portfolio returns.",
    profitPercentage: 24.6,
    winRate: 76,
    totalTrades: 219,
    followers: 731,
    riskLevel: "High",
    assets: ["BTC", "SOL", "DOGE"],
    isActive: true
  },

  {
    name: "Emma Thompson",
    username: "emma_thompson",
    bio: "Long-term simulated portfolio strategy with diversified assets.",
    profitPercentage: 21.4,
    winRate: 74,
    totalTrades: 198,
    followers: 654,
    riskLevel: "Low",
    assets: ["BTC", "ETH", "XRP"],
    isActive: true
  }
];

async function seedTraders() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    // Remove old  traders
    await Trader.deleteMany({});

    // Insert new  traders
    const createdTraders = await Trader.insertMany(traders);

    console.log(
      `${createdTraders.length} traders created successfully`
    );

    createdTraders.forEach((trader) => {
      console.log(
        `${trader.name} | +${trader.profitPercentage}% | ${trader.riskLevel} risk`
      );
    });

    await mongoose.disconnect();

    console.log("MongoDB connection closed");
    process.exit(0);

  } catch (error) {
    console.error("SEED ERROR:", error.message);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {}

    process.exit(1);
  }
}

seedTraders();