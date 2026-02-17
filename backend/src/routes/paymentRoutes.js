const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dashboard)
router.get('/', PaymentController.getAllPaymentsPublic);
router.post('/', PaymentController.simulatePayment);
router.post('/initiate-payment', PaymentController.initiatePayment);
router.post('/mpesa-callback', PaymentController.mpesaCallback);
// Admin stats (auth protected inline to avoid conflict with :paymentId)
router.get('/stats', authMiddleware, PaymentController.getPaymentStats);
router.get('/:paymentId', PaymentController.getPaymentStatus);

// Protected routes
router.use(authMiddleware);

// FR2: M-Pesa Payment Simulation (simulate STK Push, mock success)
router.post('/simulate', PaymentController.simulatePayment);

module.exports = router;
