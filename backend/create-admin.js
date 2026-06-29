const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function createData() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'meetspace'
  });

  const hash = await bcrypt.hash('123456', 10);

  // create admin
  await connection.query(`
    INSERT INTO users (email, password, name, role, studentId, department, phone, isActive)
    VALUES ('admin@tsu.ac.th', ?, 'Admin MeetSpace', 'admin', '000000', 'IT', '0999999999', 1)
    ON DUPLICATE KEY UPDATE password = ?, role = 'admin'
  `, [hash, hash]);

  // create user
  await connection.query(`
    INSERT INTO users (email, password, name, role, studentId, department, phone, isActive)
    VALUES ('user@tsu.ac.th', ?, 'Somchai User', 'user', '123456', 'Science', '0888888888', 1)
    ON DUPLICATE KEY UPDATE password = ?
  `, [hash, hash]);

  // create test rooms
  const rooms = [
    { name: 'ห้องประชุม A1', building: 'อาคารวิทยาศาสตร์', floor: 1, capacity: 20, status: 'available', equipment: JSON.stringify({ projector: true, whiteboard: true, wifi: true }) },
    { name: 'ห้องประชุม A2', building: 'อาคารวิทยาศาสตร์', floor: 1, capacity: 10, status: 'available', equipment: JSON.stringify({ whiteboard: true, wifi: true, airConditioning: true }) },
    { name: 'ห้องปฏิบัติการ B1', building: 'อาคารนวัตกรรม', floor: 2, capacity: 40, status: 'available', equipment: JSON.stringify({ projector: true, whiteboard: true, videoConferencing: true, wifi: true, microphone: true }) },
    { name: 'ห้องสมุดโซนเงียบ', building: 'ศูนย์บรรณสาร', floor: 3, capacity: 5, status: 'maintenance', equipment: JSON.stringify({ wifi: true, airConditioning: true }) }
  ];

  for (const r of rooms) {
    await connection.query(`
      INSERT INTO rooms (name, building, floor, capacity, status, equipment)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE capacity = VALUES(capacity), status = VALUES(status), equipment = VALUES(equipment)
    `, [r.name, r.building, r.floor, r.capacity, r.status, r.equipment]);
  }

  console.log("Accounts updated and rooms created successfully.");
  await connection.end();
}

createData().catch(console.error);
