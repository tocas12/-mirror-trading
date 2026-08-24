
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// CREATE JWT
// ======================================================

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  return jwt.sign(
    {
      userId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}


// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters"
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser =
      await User.findOne({
        email: normalizedEmail
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      balance: 0,
      role: "user"
    });

    const token =
      createToken(newUser._id);

    res.status(201).json({
      message:
        "Account created successfully",

      token,

      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        balance: newUser.balance,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error(
      "REGISTRATION ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Unable to create account"
    });
  }
});


// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required"
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail
      });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password"
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password"
      });
    }

    const token =
      createToken(user._id);

    res.json({
      message:
        "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role
      }
    });

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Unable to login"
    });
  }
});


// ======================================================
// CURRENT USER
// GET /api/auth/me
// ======================================================

router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      res.json({
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          balance: req.user.balance,
          role: req.user.role,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt
        }
      });

    } catch (error) {
      console.error(
        "GET USER ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Unable to retrieve user"
      });
    }
  }
);


// ======================================================
// LOGOUT
// POST /api/auth/logout
// ======================================================

router.post(
  "/logout",
  authMiddleware,
  (req, res) => {
    res.json({
      message:
        "Logout successful"
    });
  }
);


module.exports = router;
```
