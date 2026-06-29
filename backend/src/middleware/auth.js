const jwt = require("jsonwebtoken");

// Verify JWT Token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret",
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
      error: error.message,
    });
  }
};

// Admin only
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

// User or Admin
const isUserOrAdmin = (req, res, next) => {
  if (!req.user || !["user", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      message: "User or Admin access required",
    });
  }

  next();
};

// Authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      message: "User not authenticated",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isUserOrAdmin,
  isAuthenticated,
};
