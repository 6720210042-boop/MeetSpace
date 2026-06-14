const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = process.env.MYSQL_PORT || '3306';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'root';
const MYSQL_DB = process.env.MYSQL_DB || 'meetspace';

let pool;

async function init() {
  try {
    pool = await mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DB,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create database if not exists
    await pool.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\``);
    // Use database
    await pool.query(`USE \`${MYSQL_DB}\``);

    // Create users table if not exists
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT NULL,
        role ENUM('user','admin') DEFAULT 'user',
        studentId VARCHAR(100) DEFAULT NULL,
        profilePicture VARCHAR(512) DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.query(createUsersTable);

    console.log('✓ MySQL pool created and users table ensured');
  } catch (err) {
    console.error('✗ MySQL initialization error:', err);
    throw err;
  }
}

function getPool() {
  if (!pool) throw new Error('MySQL pool not initialized. Call init() first.');
  return pool;
}

module.exports = { init, getPool };
