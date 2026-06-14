const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Check if user is User or Admin
const isUserOrAdmin = (req, res, next) => {
  if (!['user', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'การเข้าถึงต้องเป็นผู้ใช้หรือผู้ดูแลระบบ' });
  }
  next();
};

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isUserOrAdmin,
  isAuthenticated
};
