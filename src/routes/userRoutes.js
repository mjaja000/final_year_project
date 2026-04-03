const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	message: { message: 'Too many attempts, please try again in 15 minutes.' },
	standardHeaders: true,
	legacyHeaders: false,
});

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authLimiter, AuthController.register);

module.exports = router;
