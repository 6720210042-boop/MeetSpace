const mysqlDB = require('../db/mysql');

// Get usage statistics (MySQL)
exports.getUsageStats = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { startDate, endDate, roomId } = req.query;

    let sql = `SELECT b.*, r.name as roomName, r.building, u.name as userName, u.role as userRole
               FROM bookings b 
               LEFT JOIN rooms r ON b.roomId = r.id 
               LEFT JOIN users u ON b.userId = u.id 
               WHERE b.status = 'confirmed'`;
    const params = [];

    if (startDate) {
      sql += ' AND b.startTime >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND b.startTime <= ?';
      params.push(endDate);
    }
    if (roomId) {
      sql += ' AND b.roomId = ?';
      params.push(roomId);
    }

    const [bookings] = await pool.query(sql, params);

    // Calculate statistics
    const stats = {
      totalBookings: bookings.length,
      totalHours: 0,
      byRoom: {},
      byUser: {},
      byPurpose: {},
      byRole: {
        user: 0,
        admin: 0
      }
    };

    bookings.forEach(booking => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      const hours = (end - start) / (1000 * 60 * 60);
      stats.totalHours += hours;

      // By Room
      const roomName = booking.roomName || 'Unknown';
      stats.byRoom[roomName] = (stats.byRoom[roomName] || 0) + 1;

      // By User
      const userName = booking.userName || 'Unknown';
      stats.byUser[userName] = (stats.byUser[userName] || 0) + 1;

      // By Purpose
      if (booking.purpose) {
        stats.byPurpose[booking.purpose] = (stats.byPurpose[booking.purpose] || 0) + 1;
      }

      // By Role
      const role = booking.userRole || 'user';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    });

    res.status(200).json({
      message: 'Usage statistics retrieved successfully',
      stats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// Get room utilization report (MySQL)
exports.getRoomUtilization = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { startDate, endDate } = req.query;

    let bookingSql = `SELECT b.*, r.name as roomName, r.capacity 
                      FROM bookings b 
                      LEFT JOIN rooms r ON b.roomId = r.id 
                      WHERE b.status IN ('confirmed','in-use')`;
    const params = [];

    if (startDate) {
      bookingSql += ' AND b.startTime >= ?';
      params.push(startDate);
    }
    if (endDate) {
      bookingSql += ' AND b.startTime <= ?';
      params.push(endDate);
    }

    const [bookings] = await pool.query(bookingSql, params);
    const [rooms] = await pool.query('SELECT * FROM rooms');

    const utilization = {};
    rooms.forEach(room => {
      const roomBookings = bookings.filter(b => b.roomId === room.id);
      let totalHours = 0;
      roomBookings.forEach(b => {
        totalHours += (new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60 * 60);
      });

      utilization[room.name] = {
        bookings: roomBookings.length,
        totalHours: totalHours.toFixed(2),
        capacity: room.capacity
      };
    });

    res.status(200).json({
      message: 'Room utilization report retrieved successfully',
      utilization
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

// Get user activity report (MySQL)
exports.getUserActivity = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { userId, startDate, endDate } = req.query;

    let sql = `SELECT b.*, r.name as roomName, r.building, u.name as userName, u.email as userEmail, u.role as userRole
               FROM bookings b 
               LEFT JOIN rooms r ON b.roomId = r.id 
               LEFT JOIN users u ON b.userId = u.id 
               WHERE 1=1`;
    const params = [];

    if (userId) {
      sql += ' AND b.userId = ?';
      params.push(userId);
    }
    if (startDate) {
      sql += ' AND b.createdAt >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND b.createdAt <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY b.createdAt DESC';

    const [bookings] = await pool.query(sql, params);

    res.status(200).json({
      message: 'User activity retrieved successfully',
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user activity', error: error.message });
  }
};
