const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/google
router.post("/google", authController.googleLogin);

// GET /api/auth/me
router.get("/me", verifyToken, authController.getCurrentUser);

// PUT /api/auth/profile
router.put("/profile", verifyToken, authController.updateProfile);

// POST /api/auth/logout
router.post("/logout", verifyToken, authController.logout);

module.exports = router;
