const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// =========================
// Booking
// =========================

// Create booking
router.post("/", verifyToken, bookingController.createBooking);

// Get all bookings (Admin)
router.get("/", verifyToken, isAdmin, bookingController.getAllBookings);

// Get my bookings
router.get("/my/bookings", verifyToken, bookingController.getUserBookings);

// Dashboard statistics
router.get("/stats/dashboard", verifyToken, bookingController.getBookingStats);

// Get booking by ID
router.get("/:id", verifyToken, bookingController.getBookingById);

// Update booking
router.put("/:id", verifyToken, bookingController.updateBooking);

// Cancel booking
router.delete("/:id", verifyToken, bookingController.cancelBooking);

// Check-in
router.post("/:id/checkin", verifyToken, bookingController.checkInBooking);

// Check-out
router.put("/:id/check-out", verifyToken, bookingController.checkOutBooking);

// Mark no-show after staff cannot contact requester
router.put("/:id/no-show", verifyToken, isAdmin, bookingController.markNoShow);

module.exports = router;
