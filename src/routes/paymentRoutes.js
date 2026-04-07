const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Callback validation middleware (optional secret-based validation)
const validateMpesaCallback = (req, res, next) => {
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET;
  
  // If no secret is configured, allow all callbacks (backward compatible)
  if (!expectedSecret) {
    return next();
  }

  const headerName = String(process.env.MPESA_CALLBACK_SECRET_HEADER || 'x-callback-secret').toLowerCase();
  const providedSecret = req.headers[headerName];

  if (providedSecret !== expectedSecret) {
    console.warn('⚠️ M-Pesa callback rejected: Invalid secret');
    return res.status(403).json({ message: 'Invalid callback signature' });
  }

  next();
};

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// M-Pesa callback endpoints - MUST be public for Safaricom to call
// These handle payment confirmations from M-Pesa
router.post('/mpesa-callback', validateMpesaCallback, PaymentController.mpesaCallback);
router.post('/mpesa/callback', validateMpesaCallback, PaymentController.mpesaCallback);

// Debug endpoint to test callback routing (can be removed in production)
router.post('/test-callback', (req, res) => {
  console.log('🔔 Test callback received:', {
    headers: req.headers,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString(),
  });
  res.status(200).json({ 
    message: 'Test callback received successfully',
    receivedData: req.body,
    note: 'This endpoint requires no authentication'
  });
});

// Public payment routes (can be called without authentication)
// This allows guests to make payments without logging in
router.get('/', PaymentController.getAllPaymentsPublic);
router.post('/', PaymentController.simulatePayment);
router.post('/simulate', PaymentController.simulatePayment);
router.post('/initiate', PaymentController.initiatePayment);
router.post('/initiate-payment', PaymentController.initiatePayment);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================
// All routes defined below this line require valid JWT token
router.use(authMiddleware);

// Admin statistics (must be before /:paymentId to avoid route conflict)
router.get('/stats', PaymentController.getPaymentStats);

// Get previous phone numbers for current authenticated user
router.get('/previous-phones', PaymentController.getPreviousPhoneNumbers);

// Get specific payment details by ID
router.get('/:paymentId', PaymentController.getPaymentStatus);

// Send payment ticket via WhatsApp
router.post('/:paymentId/send-ticket-whatsapp', PaymentController.sendTicketToWhatsApp);

module.exports = router;
