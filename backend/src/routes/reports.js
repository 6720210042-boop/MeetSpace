const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// ==========================
// Statistics
// ==========================
router.get("/statistics", verifyToken, isAdmin, reportController.getUsageStats);

// ==========================
// Room Utilization
// ==========================
router.get(
  "/utilization",
  verifyToken,
  isAdmin,
  reportController.getRoomUtilization,
);

// ==========================
// User Activity
// ==========================
router.get("/activity", verifyToken, isAdmin, reportController.getUserActivity);

// ==========================
// Booking Report
// ==========================
router.get(
  "/bookings",
  verifyToken,
  isAdmin,
  reportController.getBookingReport,
);

module.exports = router;
