const express = require('express');
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dashboard)
router.get('/', PaymentController.getUserPayments);

// Protected routes
router.use(authMiddleware);

// FR2: M-Pesa Payment Simulation (simulate STK Push, mock success)
router.post('/simulate', PaymentController.simulatePayment);

// Get payment status
router.get('/:paymentId', PaymentController.getPaymentStatus);

// Get payment statistics (admin)
router.get('/stats', PaymentController.getPaymentStats);

module.exports = router;
