const mysqlDB = require('../db/mysql');
require('dotenv').config();

async function migrate() {
  try {
    await mysqlDB.init();
    const pool = mysqlDB.getPool();

    // Create rooms table
    const createRooms = `
      CREATE TABLE IF NOT EXISTS rooms (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        building VARCHAR(255) DEFAULT NULL,
        floor INT DEFAULT NULL,
        capacity INT DEFAULT 0,
        equipment JSON DEFAULT NULL,
        description TEXT DEFAULT NULL,
        status ENUM('available','occupied','maintenance') DEFAULT 'available',
        createdBy INT UNSIGNED DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_building (building),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    // Create bookings table
    const createBookings = `
      CREATE TABLE IF NOT EXISTS bookings (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        roomId INT UNSIGNED NOT NULL,
        userId INT UNSIGNED DEFAULT NULL,
        startTime DATETIME NOT NULL,
        endTime DATETIME NOT NULL,
        purpose VARCHAR(255) DEFAULT NULL,
        numberOfParticipants INT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        status ENUM('pending','confirmed','cancelled','in-use') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_room (roomId),
        INDEX idx_user (userId),
        FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.query(createRooms);
    console.log('✓ rooms table ensured');

    await pool.query(createBookings);
    console.log('✓ bookings table ensured');

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
