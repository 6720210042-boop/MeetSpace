const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function run() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'db',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DB || 'meetspace'
  });

  const hash = await bcrypt.hash('123456', 10);

  // Create test user
  await conn.query(
    `INSERT INTO users (email, password, name, role, studentId, department, phone, isActive)
     VALUES ('test@tsu.ac.th', ?, 'Test User', 'user', '6500001', 'Science', '0888888888', 1)
     ON DUPLICATE KEY UPDATE password=?, role='user', isActive=1`,
    [hash, hash]
  );
  console.log('Created: test@tsu.ac.th');

  // Create admin
  await conn.query(
    `INSERT INTO users (email, password, name, role, studentId, department, phone, isActive)
     VALUES ('admin@tsu.ac.th', ?, 'Admin MeetSpace', 'admin', '000000', 'IT', '0999999999', 1)
     ON DUPLICATE KEY UPDATE password=?, role='admin', isActive=1`,
    [hash, hash]
  );
  console.log('Created: admin@tsu.ac.th');

  // Show all users
  const [rows] = await conn.query('SELECT id, email, name, role, isActive FROM users');
  console.log('\nUsers in database:');
  console.table(rows);

  await conn.end();
  console.log('\nDone!');
}

run().catch(console.error);
