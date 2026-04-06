const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Shared-secret validation for callback endpoints when MPESA_CALLBACK_SECRET is configured.
const validateMpesaCallback = (req, res, next) => {
	const expectedSecret = process.env.MPESA_CALLBACK_SECRET;
	if (!expectedSecret) return next();

	const headerName = String(process.env.MPESA_CALLBACK_SECRET_HEADER || 'x-callback-secret').toLowerCase();
	const providedSecret = req.headers[headerName];

	if (providedSecret !== expectedSecret) {
		return res.status(403).json({ message: 'Invalid callback signature' });
	}

	next();
};

// Public routes (for dashboard)
router.get('/', PaymentController.getAllPaymentsPublic);
router.post('/', PaymentController.simulatePayment);
router.post('/initiate', PaymentController.initiatePayment);
router.post('/initiate-payment', PaymentController.initiatePayment);
router.post('/mpesa-callback', validateMpesaCallback, PaymentController.mpesaCallback);
router.post('/mpesa/callback', validateMpesaCallback, PaymentController.mpesaCallback);
router.post('/:paymentId/send-ticket-whatsapp', authMiddleware, PaymentController.sendTicketToWhatsApp);
// Admin stats (auth protected inline to avoid conflict with :paymentId)
router.get('/stats', authMiddleware, PaymentController.getPaymentStats);
router.get('/:paymentId', authMiddleware, PaymentController.getPaymentStatus);

// Protected routes
router.use(authMiddleware);

// FR2: M-Pesa Payment Simulation (simulate STK Push, mock success)
router.post('/simulate', PaymentController.simulatePayment);

// Protected routes below
router.use(authMiddleware);

// Get previous phone numbers for current user
router.get('/previous-phones', PaymentController.getPreviousPhoneNumbers);

// Admin stats
router.get('/stats', PaymentController.getPaymentStats);

module.exports = router;
