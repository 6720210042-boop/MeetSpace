const mysqlDB = require('../db/mysql');

function parseEquipment(equipment) {
  // mysql2 v3 automatically parses JSON column to JS object
  if (!equipment) return null;
  if (typeof equipment === 'string') {
    try { return JSON.parse(equipment); } catch { return null; }
  }
  return equipment; // already an object
}

function pad(v) { return String(v).padStart(2, '0'); }
function toMySQLDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Get all rooms with filters + live status from bookings
exports.getAllRooms = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { building, capacity, equipment, status, name } = req.query;

    let sql = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];

    if (building) { sql += ' AND building = ?'; params.push(building); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (capacity) { sql += ' AND capacity >= ?'; params.push(parseInt(capacity)); }
    if (name) { sql += ' AND name LIKE ?'; params.push(`%${name}%`); }

    if (equipment) {
      const items = equipment.split(',').map(s => s.trim()).filter(Boolean);
      items.forEach(item => {
        sql += ' AND JSON_EXTRACT(equipment, ?) = true';
        params.push(`$.${item}`);
      });
    }

    sql += ' ORDER BY building ASC, floor ASC, name ASC';
    const [rows] = await pool.query(sql, params);

    // Compute live status based on current active bookings
    const now = toMySQLDate(new Date());
    const roomIds = rows.map(r => r.id);

    let occupiedIds = new Set();
    if (roomIds.length > 0) {
      const placeholders = roomIds.map(() => '?').join(',');
      const [activeRows] = await pool.query(
        `SELECT DISTINCT roomId FROM bookings
         WHERE roomId IN (${placeholders})
           AND status IN ('confirmed','pending','in-use')
           AND startTime <= ? AND endTime > ?`,
        [...roomIds, now, now]
      );
      occupiedIds = new Set(activeRows.map(r => r.roomId));
    }

    const rooms = rows.map(r => ({
      ...r,
      equipment: parseEquipment(r.equipment),
      status: r.status === 'maintenance'
        ? 'maintenance'
        : occupiedIds.has(r.id) ? 'occupied' : 'available',
    }));

    res.status(200).json({ message: 'Rooms retrieved successfully', count: rooms.length, rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
};

// Get single room
exports.getRoomById = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    const room = { ...rows[0], equipment: parseEquipment(rows[0].equipment) };
    res.status(200).json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room', error: error.message });
  }
};

// Create new room (Admin only)
exports.createRoom = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const { name, building, floor, capacity, equipment, description, status } = req.body;

    if (!name || !building || floor === undefined || capacity === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const equipmentJson = equipment ? JSON.stringify(equipment) : null;
    const [result] = await pool.query(
      'INSERT INTO rooms (name, building, floor, capacity, equipment, description, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, building, Number(floor), Number(capacity), equipmentJson, description || null, status || 'available', req.user ? req.user.id : null]
    );

    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [result.insertId]);
    const room = { ...rows[0], equipment: parseEquipment(rows[0].equipment) };

    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    console.error(error);
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
    if (floor !== undefined) { updates.push('floor = ?'); params.push(Number(floor)); }
    if (capacity !== undefined) { updates.push('capacity = ?'); params.push(Number(capacity)); }
    if (equipment !== undefined) { updates.push('equipment = ?'); params.push(JSON.stringify(equipment)); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE rooms SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, params);

    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    const room = { ...rows[0], equipment: parseEquipment(rows[0].equipment) };

    res.status(200).json({ message: 'Room updated successfully', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
};

// Delete room (Admin only)
exports.deleteRoom = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const [existing] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ message: 'Room not found' });

    // Check active bookings
    const [active] = await pool.query(
      "SELECT id FROM bookings WHERE roomId = ? AND status IN ('pending','confirmed','in-use') LIMIT 1",
      [req.params.id]
    );
    if (active.length > 0) return res.status(400).json({ message: 'ไม่สามารถลบห้องที่มีการจองอยู่' });

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

    const start = new Date(startTime);
    const end = new Date(endTime);

    const [conflicts] = await pool.query(
      `SELECT id FROM bookings WHERE roomId = ? AND status IN ('pending','confirmed','in-use')
       AND NOT (endTime <= ? OR startTime >= ?) LIMIT 1`,
      [roomId, toMySQLDate(start), toMySQLDate(end)]
    );

    res.status(200).json({ available: conflicts.length === 0, conflicts: conflicts.length });
  } catch (error) {
    res.status(500).json({ message: 'Error checking availability', error: error.message });
  }
};
