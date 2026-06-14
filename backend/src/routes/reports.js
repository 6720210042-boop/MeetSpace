const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/reports/statistics (Admin only)
router.get('/statistics', verifyToken, isAdmin, reportController.getUsageStats);

// GET /api/reports/utilization (Admin only)
router.get('/utilization', verifyToken, isAdmin, reportController.getRoomUtilization);

// GET /api/reports/activity (Admin only)
router.get('/activity', verifyToken, isAdmin, reportController.getUserActivity);

module.exports = router;
