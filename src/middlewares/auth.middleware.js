require('dotenv').config();
const jwt = require('jsonwebtoken');
const Session = require('../models/Session.model');
const CsrfToken = require('../models/CsrfToken.model');

exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // ✅ 1. Try to get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // ✅ 2. If not in header, try to get token from cookies
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }

    // ❌ No token found
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // ✅ Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await Session.findByToken(decoded.sessionToken);

    if (!session) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    req.user = {
      id: decoded.id,
      sessionToken: decoded.sessionToken
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};


exports.validateCsrf = async (req, res, next) => {
  try {
    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken) {
      return res.status(403).json({ message: 'CSRF token missing' });
    }

    const isValid = await CsrfToken.validate(req.user.id, csrfToken);
    if (!isValid) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    // Delete the used CSRF token
    await CsrfToken.delete(csrfToken);

    next();
  } catch (err) {
    next(err);
  }
};