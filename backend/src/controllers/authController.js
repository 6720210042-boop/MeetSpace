const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysqlDB = require('../db/mysql');

// helper to query
const query = async (sql, params) => {
  const pool = mysqlDB.getPool();
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Register (username/password)
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const roleValue = role === 'admin' ? 'admin' : 'user';
    const result = await query('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [email, hashed, name, roleValue]);

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', userId: result.insertId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'สมัครสมาชิกล้มเหลว', error: error.message });
  }
};

// Login with email + password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'กรุณาใส่อีเมลและรหัสผ่าน' });
    }

    const rows = await query('SELECT id, email, password, name, role FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !user.password) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เข้าสู่ระบบล้มเหลว', error: error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const rows = await query('SELECT id, email, name, role, studentId, profilePicture, createdAt, updatedAt FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

// Logout
exports.logout = (req, res) => {
  res.status(200).json({ message: 'ออกจากระบบแล้ว' });
};
