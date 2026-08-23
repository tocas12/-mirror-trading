const express = require("express");

const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ======================================================

router.get("/", authMiddleware, async (req, res) => {
  try {

    const notifications = await Notification.find({
      user: req.user._id
    }).sort({
      createdAt: -1
    });

    const unreadCount = notifications.filter(
      notification => !notification.isRead
    ).length;

    res.json({
      count: notifications.length,
      unreadCount,
      notifications
    });

  } catch (error) {

    console.error("NOTIFICATION ERROR:", error);

    res.status(500).json({
      message: "Unable to retrieve notifications"
    });

  }
});


// ======================================================
// CREATE NOTIFICATION
// POST /api/notifications
// ======================================================

router.post("/", authMiddleware, async (req, res) => {
  try {

    const {
      title,
      message,
      type
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "Title and message are required"
      });
    }

    const notification = await Notification.create({
      user: req.user._id,
      title,
      message,
      type: type || "account"
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification
    });

  } catch (error) {

    console.error(
      "CREATE NOTIFICATION ERROR:",
      error
    );

    res.status(500).json({
      message: "Unable to create notification"
    });

  }
});


// ======================================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ======================================================

router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    notification.isRead = true;

    await notification.save();

    res.json({
      message: "Notification marked as read",
      notification
    });

  } catch (error) {

    console.error(
      "READ NOTIFICATION ERROR:",
      error
    );

    res.status(500).json({
      message: "Unable to update notification"
    });

  }
});


// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ======================================================

router.patch("/read-all", authMiddleware, async (req, res) => {
  try {

    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false
      },
      {
        $set: {
          isRead: true
        }
      }
    );

    res.json({
      message: "All notifications marked as read"
    });

  } catch (error) {

    console.error(
      "READ ALL NOTIFICATIONS ERROR:",
      error
    );

    res.status(500).json({
      message: "Unable to update notifications"
    });

  }
});


module.exports = router;