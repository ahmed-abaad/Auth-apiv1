const AuthService = require('../services/auth.service');
const { validationResult } = require('express-validator');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    await AuthService.register(username, email, password);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};


exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const { token, user } = await AuthService.login(email, password, ipAddress, userAgent);

    // Optional: generate CSRF token
    // const csrfToken = await AuthService.generateCsrfToken(user.id);

    // ✅ Set JWT token as HttpOnly cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // ✅ Set CSRF token as a readable cookie (NOT httpOnly)
    // res.cookie('csrfToken', csrfToken, {
    //  httpOnly: false,
    //  secure: process.env.NODE_ENV === 'production',
    //  sameSite: 'Strict',
    //  maxAge: 7 * 24 * 60 * 60 * 1000
    // });

    // Optional: Return only non-sensitive user info in response
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    next(err);
  }
};


exports.logout = async (req, res, next) => {
  try {
    // Get sessionToken from req.user if available
    let sessionToken = req.user?.sessionToken;

    // Or fall back to reading from authToken cookie (JWT)
    if (!sessionToken && req.cookies?.authToken) {
      const decoded = jwt.verify(req.cookies.authToken, process.env.JWT_SECRET);
      sessionToken = decoded.sessionToken;
    }

    if (!sessionToken) {
      return res.status(400).json({ message: 'No session token found' });
    }

    // Invalidate session on the backend
    await AuthService.logout(sessionToken);

    // Clear the authToken cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};


exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const token = await AuthService.generatePasswordResetToken(email);
    
    if (token) {
      // In a real app, you would send an email with the reset link
      res.status(200).json({ message: 'Password reset link sent to email' });
    } else {
      res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getCsrfToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const csrfToken = await AuthService.generateCsrfToken(userId);
    res.status(200).json({ csrfToken });
  } catch (err) {
    next(err);
  }
};