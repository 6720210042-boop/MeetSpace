const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const mysqlDB = require("./db/mysql");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize MySQL
mysqlDB
  .init()
  .then(() => {
    console.log("✓ MySQL initialized successfully");
  })
  .catch((err) => {
    console.error("✗ MySQL init failed:", err.message);
    console.warn("⚠ Server will start but database operations may fail");
  });

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/university-rooms", require("./routes/rooms"));
app.use("/api/university-bookings", require("./routes/bookings"));
app.use("/api/reports", require("./routes/reports"));

// Serve static frontend files (Monolith Pattern)
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));

// Catch-all route to serve React index.html for unknown routes (Client-side routing)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next(); // Let API 404s fall through to the Error Handler
  }
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "Server is running",
    timestamp: new Date(),
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});