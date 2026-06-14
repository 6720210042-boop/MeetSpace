const mysqlDB = require('../db/mysql');

async function seed() {
  try {
    await mysqlDB.init();
    const pool = mysqlDB.getPool();

    // Check if rooms already exist
    const [existing] = await pool.query('SELECT COUNT(*) as c FROM rooms');
    if (existing[0].c > 0) {
      console.log('Rooms already seeded.');
      process.exit(0);
    }

    const rooms = [
      { name: 'ห้องประชุม A101', building: 'อาคารวิทยา', floor: 1, capacity: 20, equipment: { projector: true, whiteboard: true }, description: 'ห้องประชุมหลักชั้น 1' },
      { name: 'ห้องประชุม B201', building: 'อาคารวิทยา', floor: 2, capacity: 12, equipment: { tv: true }, description: 'ห้องประชุมเล็ก' },
      { name: 'ห้องสัมมนา C301', building: 'อาคารนวัตกรรม', floor: 3, capacity: 50, equipment: { projector: true, mic: true }, description: 'ห้องสัมมนาขนาดใหญ่' }
    ];

    for (const r of rooms) {
      await pool.query('INSERT INTO rooms (name, building, floor, capacity, equipment, description) VALUES (?, ?, ?, ?, ?, ?)', [
        r.name, r.building, r.floor, r.capacity, JSON.stringify(r.equipment), r.description
      ]);
    }

    console.log('Seeded sample rooms.');

    // Create one booking for room 1
    const [roomRows] = await pool.query('SELECT id FROM rooms LIMIT 1');
    if (roomRows && roomRows.length) {
      const roomId = roomRows[0].id;
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000); // +1h
      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h
      await pool.query('INSERT INTO bookings (roomId, userId, startTime, endTime, purpose, numberOfParticipants, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        roomId, null, start.toISOString().slice(0,19).replace('T',' '), end.toISOString().slice(0,19).replace('T',' '), 'ทดสอบการจอง', 5, 'confirmed'
      ]);
      console.log('Seeded one booking for room id', roomId);
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
