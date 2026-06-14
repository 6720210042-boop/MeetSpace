const mysqlDB = require('../db/mysql');

function formatRow(row) {
  if (!row) return null;
  if (row.equipment && typeof row.equipment === 'string') {
    try { row.equipment = JSON.parse(row.equipment); } catch (e) { row.equipment = null; }
  }
  return row;
}

// Create booking (MySQL)
exports.createBooking = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { roomId, startTime, endTime, purpose, numberOfParticipants, notes } = req.body;

    if (!roomId || !startTime || !endTime || !purpose || numberOfParticipants === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'Invalid start or end time' });
    }

    // Check room exists
    const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!rooms || rooms.length === 0) return res.status(404).json({ message: 'Room not found' });
    const room = rooms[0];

    if (numberOfParticipants > room.capacity) {
      return res.status(400).json({ message: `Room capacity is ${room.capacity}, requested ${numberOfParticipants}` });
    }

    // Check conflicts
    const conflictSql = `SELECT COUNT(*) as c FROM bookings WHERE roomId = ? AND status IN ('confirmed','in-use') AND NOT (endTime <= ? OR startTime >= ?)`;
    const [confRows] = await pool.query(conflictSql, [roomId, start.toISOString().slice(0,19).replace('T',' '), end.toISOString().slice(0,19).replace('T',' ')]);
    if (confRows[0].c > 0) {
      return res.status(409).json({ message: 'Time slot is already booked', conflictingBookings: confRows[0].c });
    }

    // Insert booking
    const insertSql = `INSERT INTO bookings (roomId, userId, startTime, endTime, purpose, numberOfParticipants, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const userId = req.user ? req.user.id : null;
    const [result] = await pool.query(insertSql, [roomId, userId, start.toISOString().slice(0,19).replace('T',' '), end.toISOString().slice(0,19).replace('T',' '), purpose, numberOfParticipants, notes || null, 'confirmed']);

    const [rows] = await pool.query('SELECT b.*, r.name as roomName, u.name as userName, u.email as userEmail FROM bookings b LEFT JOIN rooms r ON b.roomId = r.id LEFT JOIN users u ON b.userId = u.id WHERE b.id = ?', [result.insertId]);
    const booking = rows[0];
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { roomId, status, userId } = req.query;
    let sql = 'SELECT b.*, r.name as roomName, u.name as userName, u.email as userEmail FROM bookings b LEFT JOIN rooms r ON b.roomId = r.id LEFT JOIN users u ON b.userId = u.id WHERE 1=1';
    const params = [];
    if (roomId) { sql += ' AND b.roomId = ?'; params.push(roomId); }
    if (status) { sql += ' AND b.status = ?'; params.push(status); }
    if (userId) { sql += ' AND b.userId = ?'; params.push(userId); }
    sql += ' ORDER BY b.startTime DESC';
    const [rows] = await pool.query(sql, params);
    res.status(200).json({ message: 'Bookings retrieved successfully', count: rows.length, bookings: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT b.*, r.name as roomName FROM bookings b LEFT JOIN rooms r ON b.roomId = r.id WHERE b.userId = ? ORDER BY b.startTime DESC', [userId]);
    res.status(200).json({ message: 'User bookings retrieved successfully', count: rows.length, bookings: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user bookings', error: error.message });
  }
};

// Get single booking
exports.getBookingById = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const [rows] = await pool.query('SELECT b.*, r.name as roomName, u.name as userName, u.email as userEmail FROM bookings b LEFT JOIN rooms r ON b.roomId = r.id LEFT JOIN users u ON b.userId = u.id WHERE b.id = ?', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json({ booking: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { startTime, endTime, purpose, numberOfParticipants, status, notes } = req.body;
    const [existing] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const booking = existing[0];

    // Authorization
    if (booking.userId != req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const updates = [];
    const params = [];
    if (startTime) { updates.push('startTime = ?'); params.push(new Date(startTime).toISOString().slice(0,19).replace('T',' ')); }
    if (endTime) { updates.push('endTime = ?'); params.push(new Date(endTime).toISOString().slice(0,19).replace('T',' ')); }
    if (purpose !== undefined) { updates.push('purpose = ?'); params.push(purpose); }
    if (numberOfParticipants !== undefined) { updates.push('numberOfParticipants = ?'); params.push(numberOfParticipants); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });
    params.push(req.params.id);
    const sql = `UPDATE bookings SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(sql, params);
    const [rows] = await pool.query('SELECT b.*, r.name as roomName, u.name as userName FROM bookings b LEFT JOIN rooms r ON b.roomId = r.id LEFT JOIN users u ON b.userId = u.id WHERE b.id = ?', [req.params.id]);
    res.status(200).json({ message: 'Booking updated successfully', booking: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const [existing] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const booking = existing[0];
    if (booking.userId != req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    await pool.query('UPDATE bookings SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['cancelled', req.params.id]);
    const [rows] = await pool.query('SELECT b.*, r.name as roomName FROM bookings b LEFT JOIN rooms r ON b.roomId = r.id WHERE b.id = ?', [req.params.id]);
    res.status(200).json({ message: 'Booking cancelled successfully', booking: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
};

// Check-in to booking
exports.checkInBooking = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const [existing] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const booking = existing[0];
    if (booking.status !== 'confirmed') return res.status(400).json({ message: 'Only confirmed bookings can be checked in' });
    await pool.query("UPDATE bookings SET status = 'in-use', updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
    const [rows] = await pool.query('SELECT b.*, r.name as roomName FROM bookings b LEFT JOIN rooms r ON b.roomId = r.id WHERE b.id = ?', [req.params.id]);
    res.status(200).json({ message: 'Check-in successful', booking: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error checking in', error: error.message });
  }
};
