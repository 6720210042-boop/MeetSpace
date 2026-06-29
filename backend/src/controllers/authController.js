const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const mysqlDB = require("../db/mysql");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const allowedGoogleDomain = (process.env.ALLOWED_GOOGLE_DOMAIN || "tsu.ac.th").toLowerCase();
const allowLocalRegistration = process.env.ALLOW_LOCAL_REGISTRATION !== "false";
const allowPasswordLogin = process.env.ALLOW_PASSWORD_LOGIN !== "false";

async function query(sql, params) {
  const pool = mysqlDB.getPool();
  const [rows] = await pool.query(sql, params);
  return rows;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAllowedUniversityEmail(email) {
  return normalizeEmail(email).endsWith(`@${allowedGoogleDomain}`);
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId || null,
    department: user.department || null,
    phone: user.phone || null,
    profilePicture: user.profilePicture || null,
  };
}

exports.register = async (req, res) => {
  try {
    if (!allowLocalRegistration) {
      return res.status(403).json({ message: "Local registration is disabled. Use TSU Google login." });
    }

    const { email, password, name, role, studentId, department, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ message: "Email, password and name are required" });
    }

    if (!isAllowedUniversityEmail(normalizedEmail)) {
      return res.status(403).json({
        message: `Only ${allowedGoogleDomain} university accounts are allowed`,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const roleValue = role === "admin" ? "admin" : "user";
    const pool = mysqlDB.getPool();

    const [result] = await pool.query(
      `
      INSERT INTO users (email, password, name, role, studentId, department, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedEmail,
        hashed,
        name.trim(),
        roleValue,
        studentId || null,
        department || null,
        phone || null,
      ],
    );

    return res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    if (!allowPasswordLogin) {
      return res.status(403).json({ message: "Password login is disabled. Use TSU Google login." });
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!isAllowedUniversityEmail(normalizedEmail)) {
      return res.status(403).json({
        message: `Only ${allowedGoogleDomain} university accounts are allowed`,
      });
    }

    const rows = await query(
      `
      SELECT id, email, password, name, role, studentId, department, phone, profilePicture, isActive
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail],
    );

    if (rows.length === 0 || !rows[0].password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    if (user.isActive === 0) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = createToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential, department, phone } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
    }

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload.email);

    if (!payload.email_verified) {
      return res.status(403).json({ message: "Google email is not verified" });
    }

    if (!isAllowedUniversityEmail(email)) {
      return res.status(403).json({
        message: `Only ${allowedGoogleDomain} Google accounts are allowed`,
      });
    }

    const pool = mysqlDB.getPool();
    const [existing] = await pool.query(
      `
      SELECT id, email, name, role, studentId, department, phone, profilePicture, isActive
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
    );

    let user;

    if (existing.length > 0) {
      user = existing[0];

      if (user.isActive === 0) {
        return res.status(403).json({ message: "User account is inactive" });
      }

      await pool.query(
        `
        UPDATE users
        SET googleId = ?,
            name = ?,
            profilePicture = ?,
            department = COALESCE(NULLIF(?, ''), department),
            phone = COALESCE(NULLIF(?, ''), phone),
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          payload.sub,
          payload.name || user.name,
          payload.picture || user.profilePicture || null,
          department || "",
          phone || "",
          user.id,
        ],
      );

      const [updated] = await pool.query(
        `
        SELECT id, email, name, role, studentId, department, phone, profilePicture, isActive
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [user.id],
      );
      user = updated[0];
    } else {
      const [result] = await pool.query(
        `
        INSERT INTO users (email, password, name, role, googleId, profilePicture, department, phone)
        VALUES (?, NULL, ?, 'user', ?, ?, ?, ?)
        `,
        [
          email,
          payload.name || email,
          payload.sub,
          payload.picture || null,
          department || null,
          phone || null,
        ],
      );

      const [created] = await pool.query(
        `
        SELECT id, email, name, role, studentId, department, phone, profilePicture, isActive
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId],
      );
      user = created[0];
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "Google login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({ message: "Google login failed", error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rows = await query(
      `
      SELECT id, email, name, role, studentId, department, phone, profilePicture, createdAt, updatedAt
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id],
    );

    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "User retrieved successfully",
      user: publicUser(rows[0]),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, department, phone, studentId } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
    }

    if (department !== undefined) {
      updates.push("department = ?");
      params.push(department.trim());
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone.trim());
    }

    if (studentId !== undefined) {
      updates.push("studentId = ?");
      params.push(studentId || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    params.push(req.user.id);

    const pool = mysqlDB.getPool();
    await pool.query(
      `
      UPDATE users
      SET ${updates.join(", ")}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      params,
    );

    const rows = await query(
      `
      SELECT id, email, name, role, studentId, department, phone, profilePicture
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id],
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user: publicUser(rows[0]),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

exports.logout = (req, res) => {
  return res.status(200).json({ message: "Logged out successfully" });
};
