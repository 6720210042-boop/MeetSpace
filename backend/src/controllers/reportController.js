const mysqlDB = require("../db/mysql");

// Get usage statistics (MySQL)
exports.getUsageStats = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();

    // Admin only
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { startDate, endDate, roomId } = req.query;

    let sql = `
      SELECT
        b.*,
        r.name AS roomName,
        r.building,
        r.floor,
        u.name AS userName,
        u.email AS userEmail,
        u.phone AS userPhone,
        u.department AS userDepartment,
        u.role AS userRole
      FROM bookings b
      LEFT JOIN rooms r ON b.roomId = r.id
      LEFT JOIN users u ON b.userId = u.id
      WHERE b.status IN ('confirmed','completed','in-use')
    `;

    const params = [];

    if (startDate) {
      sql += " AND DATE(b.startTime) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND DATE(b.startTime) <= ?";
      params.push(endDate);
    }

    if (roomId) {
      sql += " AND b.roomId = ?";
      params.push(roomId);
    }

    sql += " ORDER BY b.startTime DESC";

    const [bookings] = await pool.query(sql, params);

    const stats = {
      totalBookings: bookings.length,
      totalHours: 0,
      byRoom: {},
      byUser: {},
      byPurpose: {},
      byRole: {
        user: 0,
        admin: 0,
      },
    };

    bookings.forEach((booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      const hours = (end - start) / (1000 * 60 * 60);
      stats.totalHours += hours;

      // Room statistics
      const roomName = booking.roomName || "Unknown";
      stats.byRoom[roomName] = (stats.byRoom[roomName] || 0) + 1;

      // User statistics
      const userName = booking.userName || "Unknown";
      stats.byUser[userName] = (stats.byUser[userName] || 0) + 1;

      // Purpose statistics
      if (booking.purpose) {
        stats.byPurpose[booking.purpose] =
          (stats.byPurpose[booking.purpose] || 0) + 1;
      }

      // Role statistics
      const role = booking.userRole || "user";
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    });

    stats.totalHours = Number(stats.totalHours.toFixed(2));

    return res.status(200).json({
      message: "Usage statistics retrieved successfully",
      stats,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// Get room utilization report (MySQL)
exports.getRoomUtilization = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();

    // Admin only
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { startDate, endDate } = req.query;

    let bookingSql = `
      SELECT
        b.*,
        r.name AS roomName,
        r.capacity,
        r.building,
        r.floor
      FROM bookings b
      LEFT JOIN rooms r ON b.roomId = r.id
      WHERE b.status IN ('confirmed','completed','in-use')
    `;

    const params = [];

    if (startDate) {
      bookingSql += " AND DATE(b.startTime) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      bookingSql += " AND DATE(b.startTime) <= ?";
      params.push(endDate);
    }

    bookingSql += " ORDER BY b.startTime DESC";

    const [bookings] = await pool.query(bookingSql, params);

    const [rooms] = await pool.query(`
      SELECT
        id,
        name,
        capacity,
        building,
        floor
      FROM rooms
      ORDER BY name
    `);

    const utilization = [];

    rooms.forEach((room) => {
      const roomBookings = bookings.filter(
        (booking) => booking.roomId === room.id
      );

      let totalHours = 0;

      roomBookings.forEach((booking) => {
        totalHours +=
          (new Date(booking.endTime) - new Date(booking.startTime)) /
          (1000 * 60 * 60);
      });

      utilization.push({
        roomId: room.id,
        roomName: room.name,
        building: room.building,
        floor: room.floor,
        capacity: room.capacity,
        totalBookings: roomBookings.length,
        totalHours: Number(totalHours.toFixed(2)),
      });
    });

    return res.status(200).json({
      message: "Room utilization report retrieved successfully",
      count: utilization.length,
      utilization,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error fetching room utilization",
      error: error.message,
    });
  }
};

// Get user activity report (MySQL)
exports.getUserActivity = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();

    // Admin only
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { userId, startDate, endDate } = req.query;

    let sql = `
      SELECT
        b.*,
        r.name AS roomName,
        r.building,
        r.floor,
        u.name AS userName,
        u.email AS userEmail,
        u.phone AS userPhone,
        u.department AS userDepartment,
        u.role AS userRole
      FROM bookings b
      LEFT JOIN rooms r ON b.roomId = r.id
      LEFT JOIN users u ON b.userId = u.id
      WHERE 1=1
    `;

    const params = [];

    if (userId) {
      sql += " AND b.userId = ?";
      params.push(userId);
    }

    if (startDate) {
      sql += " AND DATE(b.createdAt) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND DATE(b.createdAt) <= ?";
      params.push(endDate);
    }

    sql += " ORDER BY b.createdAt DESC";

    const [rows] = await pool.query(sql, params);

    const summary = {
      totalBookings: rows.length,
      pending: 0,
      confirmed: 0,
      inUse: 0,
      completed: 0,
      cancelled: 0,
    };

    rows.forEach((booking) => {
      switch (booking.status) {
        case "pending":
          summary.pending++;
          break;
        case "confirmed":
          summary.confirmed++;
          break;
        case "in-use":
          summary.inUse++;
          break;
        case "completed":
          summary.completed++;
          break;
        case "cancelled":
          summary.cancelled++;
          break;
      }
    });

    return res.status(200).json({
      message: "User activity retrieved successfully",
      summary,
      count: rows.length,
      bookings: rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error fetching user activity",
      error: error.message,
    });
  }
};

// Get booking report (MySQL)
exports.getBookingReport = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();

    // Admin only
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { startDate, endDate, roomId, status } = req.query;

    let sql = `
      SELECT
        b.id,
        b.startTime,
        b.endTime,
        b.status,
        b.purpose,
        b.numberOfParticipants,
        b.notes,
        b.createdAt,
        b.updatedAt,

        r.id AS roomId,
        r.name AS roomName,
        r.building,
        r.floor,
        r.capacity,

        u.id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        u.phone AS userPhone,
        u.department AS userDepartment,
        u.role AS userRole

      FROM bookings b
      LEFT JOIN rooms r
        ON b.roomId = r.id
      LEFT JOIN users u
        ON b.userId = u.id
      WHERE 1=1
    `;

    const params = [];

    if (startDate) {
      sql += " AND DATE(b.startTime) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND DATE(b.startTime) <= ?";
      params.push(endDate);
    }

    if (roomId) {
      sql += " AND b.roomId = ?";
      params.push(roomId);
    }

    if (status) {
      sql += " AND b.status = ?";
      params.push(status);
    }

    sql += " ORDER BY b.startTime DESC";

    const [rows] = await pool.query(sql, params);

    return res.status(200).json({
      message: "Booking report retrieved successfully",
      count: rows.length,
      report: rows,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error generating booking report",
      error: error.message,
    });
  }
};
