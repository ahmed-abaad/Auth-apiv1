const pool = require('../config/database');
const crypto = require('crypto');

class Session {
  static async create(userId, ipAddress, userAgent, expiresAt) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const [result] = await pool.execute(
      'INSERT INTO sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, sessionToken, ipAddress, userAgent, expiresAt]
    );
    return { id: result.insertId, sessionToken };
  }

  static async findByToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM sessions WHERE session_token = ? AND is_active = 1 AND expires_at > NOW()',
      [token]
    );
    return rows[0];
  }

  static async invalidate(token) {
    await pool.execute(
      'UPDATE sessions SET is_active = 0 WHERE session_token = ?',
      [token]
    );
  }

  static async invalidateAllForUser(userId) {
    await pool.execute(
      'UPDATE sessions SET is_active = 0 WHERE user_id = ?',
      [userId]
    );
  }
}

module.exports = Session;