const pool = require('../config/database');

class LoginHistory {
  static async recordLogin(userId, ipAddress, userAgent, success) {
    await pool.execute(
      'INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
      [userId, ipAddress, userAgent, success ? 1 : 0]
    );
  }

  static async getUserLoginHistory(userId, limit = 10) {
    const [rows] = await pool.execute(
      'SELECT * FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }
}

module.exports = LoginHistory;