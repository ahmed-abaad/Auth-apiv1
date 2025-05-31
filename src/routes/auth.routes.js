const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin, validatePasswordReset } = require('../validations/auth.validation');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', validatePasswordReset, authController.resetPassword);

// Protected routes
router.get('/csrf-token', authenticate, authController.getCsrfToken);
router.post('/logout', authenticate, authController.logout);

module.exports = router;