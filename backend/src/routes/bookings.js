const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST /api/university-bookings
router.post('/', verifyToken, bookingController.createBooking);

// GET /api/university-bookings
router.get('/', verifyToken, bookingController.getAllBookings);

// GET /api/university-bookings/my
router.get('/my/bookings', verifyToken, bookingController.getUserBookings);

// GET /api/university-bookings/:id
router.get('/:id', verifyToken, bookingController.getBookingById);

// PUT /api/university-bookings/:id
router.put('/:id', verifyToken, bookingController.updateBooking);

// DELETE /api/university-bookings/:id
router.delete('/:id', verifyToken, bookingController.cancelBooking);

// POST /api/university-bookings/:id/checkin
router.post('/:id/checkin', verifyToken, bookingController.checkInBooking);

module.exports = router;
