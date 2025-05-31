const pool = require('../config/database');
const crypto = require('crypto');

class PasswordResetToken {
  static async create(userId, expiresAt) {
    const token = crypto.randomBytes(32).toString('hex');
    const [result] = await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
    return { id: result.insertId, token };
  }

  static async findByToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND is_used = 0 AND expires_at > NOW()',
      [token]
    );
    return rows[0];
  }

  static async markAsUsed(token) {
    await pool.execute(
      'UPDATE password_reset_tokens SET is_used = 1 WHERE token = ?',
      [token]
    );
  }
}

module.exports = PasswordResetToken;