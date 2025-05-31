require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Session = require('../models/Session.model');
const PasswordResetToken = require('../models/PasswordResetToken.model');
const LoginHistory = require('../models/LoginHistory.model');
const CsrfToken = require('../models/CsrfToken.model');

class AuthService {
  static async register(username, email, password) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const userId = await User.create({
      username,
      email,
      passwordHash,
      salt
    });
    
    return userId;
  }

  static async login(email, password, ipAddress, userAgent) {
    const user = await User.findByEmail(email);
    if (!user) {
      await LoginHistory.recordLogin(null, ipAddress, userAgent, false);
      throw new Error('Invalid credentials');
    }

    if (user.is_locked) {
      throw new Error('Account is locked');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await User.updateLoginAttempts(user.id, user.failed_login_attempts + 1);
      await LoginHistory.recordLogin(user.id, ipAddress, userAgent, false);

      if (user.failed_login_attempts + 1 >= 5) {
        await User.lockAccount(user.id);
        throw new Error('Account locked due to too many failed attempts');
      }

      throw new Error('Invalid credentials');
    }

    await User.updateLastLogin(user.id);
    await LoginHistory.recordLogin(user.id, ipAddress, userAgent, true);

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const { sessionToken } = await Session.create(user.id, ipAddress, userAgent, expiresAt);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, sessionToken }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return { token, user };
  }

  static async logout(sessionToken) {
    await Session.invalidate(sessionToken);
  }

  static async generatePasswordResetToken(email) {
    const user = await User.findByEmail(email);
    if (!user) return null;

    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    const { token } = await PasswordResetToken.create(user.id, expiresAt);
    return token;
  }

  static async resetPassword(token, newPassword) {
    const resetToken = await PasswordResetToken.findByToken(token);
    if (!resetToken) {
      throw new Error('Invalid or expired token');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.updatePassword(resetToken.user_id, passwordHash, salt);
    await PasswordResetToken.markAsUsed(token);
    await Session.invalidateAllForUser(resetToken.user_id);
  }

  static async generateCsrfToken(userId) {
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    const { token } = await CsrfToken.create(userId, expiresAt);
    return token;
  }

  static async validateCsrfToken(userId, token) {
    return await CsrfToken.validate(userId, token);
  }
}

module.exports = AuthService;