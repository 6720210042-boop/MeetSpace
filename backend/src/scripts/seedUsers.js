const mysqlDB = require('../db/mysql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  try {
    await mysqlDB.init();
    const pool = mysqlDB.getPool();

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tsu.ac.th';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPass123';
    const adminName = process.env.SEED_ADMIN_NAME || 'Admin';

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (existing.length > 0) {
      console.log(`Admin user already exists: ${adminEmail}`);
      return process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(adminPassword, salt);

    const [res] = await pool.query('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [adminEmail, hashed, adminName, 'admin']);
    console.log('Seeded admin user with id:', res.insertId);
    console.log(`Email: ${adminEmail} Password: ${adminPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
