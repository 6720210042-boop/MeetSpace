const mysqlDB = require("../db/mysql");

const ACTIVE_STATUSES = ["pending", "confirmed", "in-use"];
const ADMIN_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "in-use",
  "completed",
  "no-show",
];

function parseEquipment(equipment) {
  if (!equipment || typeof equipment !== "string") return equipment || null;

  try {
    return JSON.parse(equipment);
  } catch (error) {
    return null;
  }
}

function formatRow(row) {
  if (!row) return null;

  return {
    ...row,
    equipment: parseEquipment(row.equipment),
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toMySQLDate(date) {
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }

  return result;
}

function validateDateRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Invalid date format" };
  }

  if (start >= end) {
    return { error: "Start time must be before end time" };
  }

  if (start.toDateString() !== end.toDateString()) {
    return { error: "Bookings cannot cross multiple days" };
  }

  if (![0, 30].includes(start.getMinutes()) || ![0, 30].includes(end.getMinutes())) {
    return { error: "Bookings must use 30-minute intervals" };
  }

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  if (startHour < 8 || endHour > 17) {
    return { error: "Bookings are allowed only between 08:00 and 17:00" };
  }

  return { start, end };
}

function validateAdvanceWindow(start) {
  // Use Thailand time (UTC+7) for "today" so the 3-business-day window is correct
  const nowUTC = Date.now();
  const nowTH = new Date(nowUTC); // mysql pool is configured with timezone: '+07:00', so comparisons use TH time

  // Compute min booking date: 3 business days from today (TH local date)
  const minBookingDate = addBusinessDays(nowTH, 3);
  minBookingDate.setHours(0, 0, 0, 0);

  if (start < minBookingDate) {
    return "ต้องจองล่วงหน้าอย่างน้อย 3 วันทำการ (เพื่อให้เจ้าหน้าที่เตรียมห้อง)";
  }

  return null;
}

async function getBooking(pool, id) {
  const [rows] = await pool.query(
    `
    SELECT
      b.*,
      r.name AS roomName,
      r.building,
      r.floor,
      r.capacity,
      r.equipment,
      u.name AS userName,
      u.email AS userEmail,
      u.phone AS userPhone,
      u.department AS userDepartment,
      u.studentId AS userStudentId
    FROM bookings b
    LEFT JOIN rooms r ON b.roomId = r.id
    LEFT JOIN users u ON b.userId = u.id
    WHERE b.id = ?
    LIMIT 1
    `,
    [id],
  );

  return formatRow(rows[0]);
}

function canAccessBooking(user, booking) {
  return user && booking && (user.role === "admin" || Number(booking.userId) === Number(user.id));
}

async function releaseExpiredNoShows(pool) {
  // Removed auto-cancellation. Admin will manually contact and cancel.
}

exports.createBooking = async (req, res) => {
  const pool = mysqlDB.getPool();
  const connection = await pool.getConnection();

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      roomId,
      startTime,
      endTime,
      purpose,
      numberOfParticipants,
      notes,
      requesterName,
      requesterEmail,
      requesterPhone,
      requesterDepartment,
    } = req.body;

    if (!roomId || !startTime || !endTime || !purpose || numberOfParticipants === undefined) {
      return res.status(400).json({ message: "Missing required booking fields" });
    }

    const roomIdNum = Number(roomId);
    const participants = Number(numberOfParticipants);

    if (!Number.isInteger(roomIdNum) || roomIdNum <= 0) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    if (!Number.isInteger(participants) || participants <= 0) {
      return res.status(400).json({ message: "Participants must be greater than 0" });
    }

    const range = validateDateRange(startTime, endTime);
    if (range.error) return res.status(400).json({ message: range.error });

    const advanceError = validateAdvanceWindow(range.start);
    if (advanceError) return res.status(400).json({ message: advanceError });

    const startSQL = toMySQLDate(range.start);
    const endSQL = toMySQLDate(range.end);

    await connection.beginTransaction();

    const [[user]] = await connection.query(
      `
      SELECT id, name, email, phone, department, isActive
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id],
    );

    if (!user || user.isActive === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "User account is not active" });
    }

    const contactName = (requesterName || user.name || "").trim();
    const contactEmail = (requesterEmail || user.email || "").trim().toLowerCase();
    const contactPhone = (requesterPhone || user.phone || "").trim();
    const contactDepartment = (requesterDepartment || user.department || "").trim();

    if (!contactName || !contactEmail || !contactPhone || !contactDepartment) {
      await connection.rollback();
      return res.status(400).json({
        message: "Requester name, email, phone and department are required",
      });
    }

    const [rooms] = await connection.query(
      "SELECT id, name, capacity, status FROM rooms WHERE id = ? FOR UPDATE",
      [roomIdNum],
    );

    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Room not found" });
    }

    const room = rooms[0];

    if (room.status === "maintenance") {
      await connection.rollback();
      return res.status(400).json({ message: "Room is under maintenance" });
    }

    if (participants > Number(room.capacity)) {
      await connection.rollback();
      return res.status(400).json({
        message: `Room capacity is ${room.capacity}`,
      });
    }

    const [conflicts] = await connection.query(
      `
      SELECT id, startTime, endTime, status
      FROM bookings
      WHERE roomId = ?
        AND status IN ('pending','confirmed','in-use')
        AND NOT (endTime <= ? OR startTime >= ?)
      LIMIT 1
      FOR UPDATE
      `,
      [roomIdNum, startSQL, endSQL],
    );

    if (conflicts.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Time slot is already booked",
        conflict: conflicts[0],
      });
    }

    const [result] = await connection.query(
      `
      INSERT INTO bookings (
        roomId,
        userId,
        startTime,
        endTime,
        purpose,
        numberOfParticipants,
        notes,
        status,
        requesterName,
        requesterEmail,
        requesterPhone,
        requesterDepartment
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)
      `,
      [
        roomIdNum,
        req.user.id,
        startSQL,
        endSQL,
        purpose.trim(),
        participants,
        notes || null,
        contactName,
        contactEmail,
        contactPhone,
        contactDepartment,
      ],
    );

    await connection.commit();

    const booking = await getBooking(pool, result.insertId);

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);

    return res.status(500).json({
      message: "Error creating booking",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    await releaseExpiredNoShows(pool);

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { roomId, status, userId, startDate, endDate } = req.query;
    const params = [];
    let sql = `
      SELECT
        b.*,
        r.name AS roomName,
        r.building,
        r.floor,
        r.capacity,
        u.name AS userName,
        u.email AS userEmail,
        u.phone AS userPhone,
        u.department AS userDepartment,
        u.studentId AS userStudentId
      FROM bookings b
      LEFT JOIN rooms r ON b.roomId = r.id
      LEFT JOIN users u ON b.userId = u.id
      WHERE 1=1
    `;

    if (roomId) {
      sql += " AND b.roomId = ?";
      params.push(Number(roomId));
    }

    if (status) {
      sql += " AND b.status = ?";
      params.push(status);
    }

    if (userId) {
      sql += " AND b.userId = ?";
      params.push(Number(userId));
    }

    if (startDate) {
      sql += " AND DATE(b.startTime) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND DATE(b.startTime) <= ?";
      params.push(endDate);
    }

    sql += " ORDER BY b.startTime DESC";

    const [rows] = await pool.query(sql, params);

    return res.status(200).json({
      message: "Bookings retrieved successfully",
      count: rows.length,
      bookings: rows.map(formatRow),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    await releaseExpiredNoShows(pool);

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const [rows] = await pool.query(
      `
      SELECT
        b.*,
        r.name AS roomName,
        r.building,
        r.floor,
        r.capacity,
        r.equipment
      FROM bookings b
      LEFT JOIN rooms r ON b.roomId = r.id
      WHERE b.userId = ?
      ORDER BY b.startTime DESC
      `,
      [req.user.id],
    );

    return res.status(200).json({
      message: "User bookings retrieved successfully",
      count: rows.length,
      bookings: rows.map(formatRow),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching user bookings", error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    await releaseExpiredNoShows(pool);

    const booking = await getBooking(pool, req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!canAccessBooking(req.user, booking)) return res.status(403).json({ message: "Unauthorized" });

    return res.status(200).json({
      message: "Booking retrieved successfully",
      booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching booking", error: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  const pool = mysqlDB.getPool();
  const connection = await pool.getConnection();

  try {
    const {
      startTime,
      endTime,
      purpose,
      numberOfParticipants,
      status,
      notes,
      requesterPhone,
      requesterDepartment,
    } = req.body;

    await connection.beginTransaction();

    const [existing] = await connection.query(
      "SELECT * FROM bookings WHERE id = ? FOR UPDATE",
      [req.params.id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = existing[0];

    if (!canAccessBooking(req.user, booking)) {
      await connection.rollback();
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (["cancelled", "completed", "no-show"].includes(booking.status) && req.user.role !== "admin") {
      await connection.rollback();
      return res.status(400).json({ message: "Booking cannot be updated" });
    }

    const newStartInput = startTime || booking.startTime;
    const newEndInput = endTime || booking.endTime;
    const range = validateDateRange(newStartInput, newEndInput);
    if (range.error) {
      await connection.rollback();
      return res.status(400).json({ message: range.error });
    }

    const advanceError = validateAdvanceWindow(range.start);
    if (advanceError && req.user.role !== "admin") {
      await connection.rollback();
      return res.status(400).json({ message: advanceError });
    }

    const startSQL = toMySQLDate(range.start);
    const endSQL = toMySQLDate(range.end);
    const participants =
      numberOfParticipants === undefined
        ? Number(booking.numberOfParticipants)
        : Number(numberOfParticipants);

    if (!Number.isInteger(participants) || participants <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Participants must be greater than 0" });
    }

    const [rooms] = await connection.query(
      "SELECT id, capacity, status FROM rooms WHERE id = ? FOR UPDATE",
      [booking.roomId],
    );

    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Room not found" });
    }

    if (participants > Number(rooms[0].capacity)) {
      await connection.rollback();
      return res.status(400).json({ message: `Room capacity is ${rooms[0].capacity}` });
    }

    const [conflicts] = await connection.query(
      `
      SELECT id
      FROM bookings
      WHERE roomId = ?
        AND id <> ?
        AND status IN ('pending','confirmed','in-use')
        AND NOT (endTime <= ? OR startTime >= ?)
      LIMIT 1
      FOR UPDATE
      `,
      [booking.roomId, booking.id, startSQL, endSQL],
    );

    if (conflicts.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Time slot is already booked" });
    }

    const updates = [];
    const params = [];

    if (startTime !== undefined) {
      updates.push("startTime = ?");
      params.push(startSQL);
    }

    if (endTime !== undefined) {
      updates.push("endTime = ?");
      params.push(endSQL);
    }

    if (purpose !== undefined) {
      updates.push("purpose = ?");
      params.push(purpose.trim());
    }

    if (numberOfParticipants !== undefined) {
      updates.push("numberOfParticipants = ?");
      params.push(participants);
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      params.push(notes || null);
    }

    if (requesterPhone !== undefined) {
      updates.push("requesterPhone = ?");
      params.push(requesterPhone);
    }

    if (requesterDepartment !== undefined) {
      updates.push("requesterDepartment = ?");
      params.push(requesterDepartment);
    }

    if (status !== undefined) {
      if (req.user.role !== "admin") {
        await connection.rollback();
        return res.status(403).json({ message: "Only admins can change booking status" });
      }

      if (!ADMIN_STATUSES.includes(status)) {
        await connection.rollback();
        return res.status(400).json({ message: "Invalid booking status" });
      }

      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "No fields to update" });
    }

    params.push(req.params.id);

    await connection.query(
      `
      UPDATE bookings
      SET ${updates.join(", ")}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      params,
    );

    await connection.commit();

    const updated = await getBooking(pool, req.params.id);

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: updated,
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: "Error updating booking", error: error.message });
  } finally {
    connection.release();
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const booking = await getBooking(pool, req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!canAccessBooking(req.user, booking)) return res.status(403).json({ message: "Unauthorized" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Booking already cancelled" });
    if (booking.status === "completed") return res.status(400).json({ message: "Completed booking cannot be cancelled" });
    if (booking.status === "in-use") return res.status(400).json({ message: "Booking is currently in use" });

    await pool.query(
      "UPDATE bookings SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id],
    );

    return res.status(200).json({
      message: "Booking cancelled successfully",
      booking: await getBooking(pool, req.params.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error cancelling booking", error: error.message });
  }
};

exports.checkInBooking = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const booking = await getBooking(pool, req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!canAccessBooking(req.user, booking)) return res.status(403).json({ message: "Unauthorized" });
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: "Booking cannot be checked in" });
    }

    const now = new Date();
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const lateLimit = new Date(start.getTime() + 10 * 60 * 1000);

    if (now < start) return res.status(400).json({ message: "Check-in is not open yet" });
    if (now > end) return res.status(400).json({ message: "Check-in time has ended" });
    if (now > lateLimit) {
      return res.status(400).json({
        message: "Booking is more than 10 minutes late. Please contact staff.",
      });
    }
    if (booking.checkedIn) return res.status(400).json({ message: "Booking already checked in" });

    await pool.query(
      `
      UPDATE bookings
      SET status = 'in-use',
          checkedIn = 1,
          checkInTime = NOW(),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [req.params.id],
    );

    return res.status(200).json({
      message: "Check-in successful",
      booking: await getBooking(pool, req.params.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error checking in", error: error.message });
  }
};

exports.checkOutBooking = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    const booking = await getBooking(pool, req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!canAccessBooking(req.user, booking)) return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "in-use") return res.status(400).json({ message: "Booking is not currently in use" });

    await pool.query(
      `
      UPDATE bookings
      SET status = 'completed',
          checkedOut = 1,
          checkOutTime = NOW(),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [req.params.id],
    );

    return res.status(200).json({
      message: "Check-out successful",
      booking: await getBooking(pool, req.params.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error checking out", error: error.message });
  }
};

exports.markNoShow = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const pool = mysqlDB.getPool();
    const booking = await getBooking(pool, req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: "Only pending or confirmed bookings can be marked no-show" });
    }

    await pool.query(
      `
      UPDATE bookings
      SET status = 'no-show',
          autoReleasedAt = NOW(),
          notes = CONCAT(COALESCE(notes, ''), IF(COALESCE(notes, '') = '', '', '\n'), ?),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      ["Marked no-show by staff after unsuccessful contact.", req.params.id],
    );

    return res.status(200).json({
      message: "Booking marked as no-show",
      booking: await getBooking(pool, req.params.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error marking no-show", error: error.message });
  }
};

exports.getBookingStats = async (req, res) => {
  try {
    const pool = mysqlDB.getPool();
    await releaseExpiredNoShows(pool);

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const [[summary]] = await pool.query(
      `
      SELECT
        COUNT(*) AS totalBookings,
        SUM(status = 'pending') AS pending,
        SUM(status = 'confirmed') AS confirmed,
        SUM(status = 'in-use') AS inUse,
        SUM(status = 'completed') AS completed,
        SUM(status = 'cancelled') AS cancelled,
        SUM(status = 'no-show') AS noShow,
        SUM(DATE(startTime) = CURDATE()) AS todayBookings
      FROM bookings
      `,
    );

    return res.status(200).json({
      message: "Statistics retrieved successfully",
      statistics: {
        totalBookings: Number(summary.totalBookings || 0),
        pending: Number(summary.pending || 0),
        confirmed: Number(summary.confirmed || 0),
        inUse: Number(summary.inUse || 0),
        completed: Number(summary.completed || 0),
        cancelled: Number(summary.cancelled || 0),
        noShow: Number(summary.noShow || 0),
        todayBookings: Number(summary.todayBookings || 0),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving statistics", error: error.message });
  }
};
