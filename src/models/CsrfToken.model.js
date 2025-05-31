const pool = require('../config/database');
const crypto = require('crypto');

class CsrfToken {
  static async create(userId, expiresAt) {
    const token = crypto.randomBytes(32).toString('hex');
    const [result] = await pool.execute(
      'INSERT INTO csrf_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
    return { id: result.insertId, token };
  }

  static async validate(userId, token) {
    const [rows] = await pool.execute(
      'SELECT * FROM csrf_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [userId, token]
    );
    return rows.length > 0;
  }

  static async delete(token) {
    await pool.execute(
      'DELETE FROM csrf_tokens WHERE token = ?',
      [token]
    );
  }

  static async deleteExpired() {
    await pool.execute(
      'DELETE FROM csrf_tokens WHERE expires_at <= NOW()'
    );
  }
}

module.exports = CsrfToken;