const pool = require('../config/database');

class User {
  static async create({ username, email, passwordHash, salt }) {
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, salt]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async updateLoginAttempts(userId, attempts) {
    await pool.execute(
      'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
      [attempts, userId]
    );
  }

  static async updateLastLogin(userId) {
    await pool.execute(
      'UPDATE users SET last_login = NOW(), failed_login_attempts = 0 WHERE id = ?',
      [userId]
    );
  }

  static async lockAccount(userId) {
    await pool.execute(
      'UPDATE users SET is_locked = 1 WHERE id = ?',
      [userId]
    );
  }
}

module.exports = User;