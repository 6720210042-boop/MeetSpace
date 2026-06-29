const mysqlDB = require('../db/mysql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  try {
    await mysqlDB.init();
    const pool = mysqlDB.getPool();

    const adminEmail = 'admin@tsu.ac.th';
    const testEmail = 'test@tsu.ac.th';
    const password = '123456';
    const adminName = 'Admin';
    const testName = 'Test User';

    const [existingAdmin] = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (existingAdmin.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const [res] = await pool.query('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [adminEmail, hashed, adminName, 'admin']);
      console.log('Seeded admin user with id:', res.insertId);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    const [existingTest] = await pool.query('SELECT id FROM users WHERE email = ?', [testEmail]);
    if (existingTest.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const [res] = await pool.query('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [testEmail, hashed, testName, 'user']);
      console.log('Seeded test user with id:', res.insertId);
    } else {
      console.log(`Test user already exists: ${testEmail}`);
    }

    console.log(`Email: ${adminEmail} / Password: ${password}`);
    console.log(`Email: ${testEmail} / Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
