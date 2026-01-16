const express = require('express');
const AdminController = require('../controllers/adminController');
// Note: Dashboard login is hardcoded (admin/admin) in management.js
// No auth middleware required for demo purposes

const router = express.Router();

// Database health check
router.get('/health/db', AdminController.checkDatabaseHealth);

// FR5: Admin Dashboard Overview
router.get('/dashboard', AdminController.getDashboardOverview);

// FR5: Feedback Management with filtering (by date, route, vehicle)
router.get('/feedback', AdminController.getAllFeedback);
router.get('/feedback/stats', AdminController.getFeedbackStats);

// FR5: Payment Management with filtering (by date, route, status)
router.get('/payments', AdminController.getAllPayments);
router.get('/payments/stats', AdminController.getPaymentStats);

module.exports = router;
