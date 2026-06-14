const mysqlDB = require('../db/mysql');

function parseEquipment(equipment) {
  try {
    return equipment ? JSON.parse(equipment) : null;
  } catch (e) {
    return null;
  }
}

// Get all rooms with filters (MySQL)
exports.getAllRooms = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { building, capacity, equipment, status } = req.query;

    let sql = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];

    if (building) {
      sql += ' AND building = ?';
      params.push(building);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (capacity) {
      sql += ' AND capacity >= ?';
      params.push(parseInt(capacity));
    }

    if (equipment) {
      // support comma-separated equipment
      const items = equipment.split(',').map(s => s.trim());
      items.forEach(item => {
        sql += ' AND JSON_EXTRACT(equipment, ?) = true';
        params.push(`$.${item}`);
      });
    }

    sql += ' ORDER BY building ASC, floor ASC, name ASC';

    const [rows] = await pool.query(sql, params);

    // parse equipment JSON
    const rooms = rows.map(r => ({ ...r, equipment: parseEquipment(r.equipment) }));

    res.status(200).json({ message: 'Rooms retrieved successfully', count: rooms.length, rooms });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
};

// Get single room
exports.getRoomById = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    const room = rows[0];
    room.equipment = parseEquipment(room.equipment);
    res.status(200).json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room', error: error.message });
  }
};

// Create new room (Admin only)
exports.createRoom = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { name, building, floor, capacity, equipment, description } = req.body;

    if (!name || !building || floor === undefined || capacity === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const equipmentJson = equipment ? JSON.stringify(equipment) : null;
    const [result] = await pool.query(
      'INSERT INTO rooms (name, building, floor, capacity, equipment, description, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, building, floor, capacity, equipmentJson, description || null, req.user ? req.user.id : null]
    );

    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [result.insertId]);
    const room = rows[0];
    room.equipment = parseEquipment(room.equipment);

    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
};

// Update room (Admin only)
exports.updateRoom = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { name, building, floor, capacity, equipment, status, description } = req.body;
    const [existing] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ message: 'Room not found' });

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (building !== undefined) { updates.push('building = ?'); params.push(building); }
    if (floor !== undefined) { updates.push('floor = ?'); params.push(floor); }
    if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }
    if (equipment !== undefined) { updates.push('equipment = ?'); params.push(JSON.stringify(equipment)); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

    params.push(req.params.id);
    const sql = `UPDATE rooms SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(sql, params);

    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    const room = rows[0];
    room.equipment = parseEquipment(room.equipment);

    res.status(200).json({ message: 'Room updated successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
};

// Delete room (Admin only)
exports.deleteRoom = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const [existing] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ message: 'Room not found' });
    await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
};

// Check room availability
exports.checkAvailability = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { startTime, endTime } = req.query;
    const roomId = req.params.id;

    if (!startTime || !endTime) return res.status(400).json({ message: 'Start time and end time required' });

    const sql = `SELECT COUNT(*) as conflicts FROM bookings WHERE roomId = ? AND status IN ('confirmed','in-use') AND NOT (endTime <= ? OR startTime >= ?)`;
    const [rows] = await pool.query(sql, [roomId, startTime, endTime]);
    const conflicts = rows[0].conflicts || 0;

    res.status(200).json({ available: conflicts === 0, conflictingBookings: conflicts });
  } catch (error) {
    res.status(500).json({ message: 'Error checking availability', error: error.message });
  }
};
