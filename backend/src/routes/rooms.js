const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// GET /api/university-rooms
router.get("/", roomController.getAllRooms);

// GET /api/university-rooms/:id
router.get("/:id", roomController.getRoomById);

// GET /api/university-rooms/:id/availability
router.get("/:id/availability", roomController.checkAvailability);

// POST /api/university-rooms (Admin only)
router.post("/", verifyToken, isAdmin, roomController.createRoom);

// PUT /api/university-rooms/:id (Admin only)
router.put("/:id", verifyToken, isAdmin, roomController.updateRoom);

// DELETE /api/university-rooms/:id (Admin only)
router.delete("/:id", verifyToken, isAdmin, roomController.deleteRoom);

module.exports = router;
