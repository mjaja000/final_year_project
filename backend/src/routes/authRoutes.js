const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth', timestamp: new Date() });
});

// Public routes (rate limited)
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
// Demo admin login (returns JWT for demo admin)
router.post('/demo_login', authLimiter, AuthController.demoLogin);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
