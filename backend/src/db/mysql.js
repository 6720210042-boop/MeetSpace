const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST || "127.0.0.1";
const MYSQL_PORT = process.env.MYSQL_PORT || "3306";
const MYSQL_USER = process.env.MYSQL_USER || "root";
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "";
const MYSQL_DB = process.env.MYSQL_DB || "meetspace";
const MYSQL_CONNECTION_LIMIT = Number(process.env.MYSQL_CONNECTION_LIMIT || 25);

let pool;

async function ignoreDuplicateColumn(sql) {
  try {
    await pool.query(sql);
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  }
}

async function ignoreDuplicateIndex(sql) {
  try {
    await pool.query(sql);
  } catch (error) {
    if (error.code !== "ER_DUP_KEYNAME") throw error;
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('user','admin') DEFAULT 'user',
      studentId VARCHAR(100) NULL,
      department VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      googleId VARCHAR(255) NULL,
      profilePicture VARCHAR(512) NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      building VARCHAR(255) DEFAULT NULL,
      floor INT DEFAULT NULL,
      capacity INT NOT NULL DEFAULT 0,
      equipment JSON DEFAULT NULL,
      description TEXT DEFAULT NULL,
      status ENUM('available','occupied','maintenance') DEFAULT 'available',
      createdBy INT UNSIGNED DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      roomId INT UNSIGNED NOT NULL,
      userId INT UNSIGNED DEFAULT NULL,
      startTime DATETIME NOT NULL,
      endTime DATETIME NOT NULL,
      purpose VARCHAR(255) NOT NULL,
      numberOfParticipants INT NOT NULL DEFAULT 1,
      notes TEXT DEFAULT NULL,
      status ENUM('pending','confirmed','cancelled','in-use','completed','no-show') DEFAULT 'confirmed',
      requesterName VARCHAR(255) DEFAULT NULL,
      requesterEmail VARCHAR(255) DEFAULT NULL,
      requesterPhone VARCHAR(50) DEFAULT NULL,
      requesterDepartment VARCHAR(255) DEFAULT NULL,
      checkedIn TINYINT(1) NOT NULL DEFAULT 0,
      checkedOut TINYINT(1) NOT NULL DEFAULT 0,
      checkInTime DATETIME DEFAULT NULL,
      checkOutTime DATETIME DEFAULT NULL,
      autoReleasedAt DATETIME DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_bookings_room
        FOREIGN KEY (roomId) REFERENCES rooms(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_bookings_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await ignoreDuplicateColumn("ALTER TABLE users ADD COLUMN department VARCHAR(255) NULL AFTER studentId");
  await ignoreDuplicateColumn("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER department");
  await ignoreDuplicateColumn("ALTER TABLE users ADD COLUMN googleId VARCHAR(255) NULL AFTER phone");
  await ignoreDuplicateColumn("ALTER TABLE users ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1 AFTER profilePicture");
  await pool.query("ALTER TABLE users MODIFY password VARCHAR(255) NULL");

  await pool.query(
    "ALTER TABLE bookings MODIFY status ENUM('pending','confirmed','cancelled','in-use','completed','no-show') DEFAULT 'confirmed'",
  );
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN requesterName VARCHAR(255) DEFAULT NULL AFTER status");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN requesterEmail VARCHAR(255) DEFAULT NULL AFTER requesterName");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN requesterPhone VARCHAR(50) DEFAULT NULL AFTER requesterEmail");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN requesterDepartment VARCHAR(255) DEFAULT NULL AFTER requesterPhone");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN checkedIn TINYINT(1) NOT NULL DEFAULT 0 AFTER requesterDepartment");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN checkedOut TINYINT(1) NOT NULL DEFAULT 0 AFTER checkedIn");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN checkInTime DATETIME DEFAULT NULL AFTER checkedOut");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN checkOutTime DATETIME DEFAULT NULL AFTER checkInTime");
  await ignoreDuplicateColumn("ALTER TABLE bookings ADD COLUMN autoReleasedAt DATETIME DEFAULT NULL AFTER checkOutTime");

  await ignoreDuplicateIndex("CREATE INDEX idx_users_google ON users (googleId)");
  await ignoreDuplicateIndex("CREATE INDEX idx_rooms_filters ON rooms (status, capacity, name)");
  await ignoreDuplicateIndex("CREATE INDEX idx_bookings_conflict ON bookings (roomId, status, startTime, endTime)");
  await ignoreDuplicateIndex("CREATE INDEX idx_bookings_user_start ON bookings (userId, startTime)");
}

async function init() {
  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();

  pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    waitForConnections: true,
    connectionLimit: MYSQL_CONNECTION_LIMIT,
    queueLimit: 100,
    timezone: "+07:00",
    charset: "utf8mb4",
  });

  await ensureSchema();
  console.log("MySQL initialized successfully");
}

function getPool() {
  if (!pool) {
    throw new Error("MySQL pool not initialized. Call init() first.");
  }

  return pool;
}

module.exports = {
  init,
  getPool,
};
