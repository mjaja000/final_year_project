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
router.put('/feedback/:feedbackId/status', AdminController.updateFeedbackStatus);

// Reports from complaint-demo (separate table)
router.get('/reports', AdminController.getAllReports);

// FR5: Payment Management with filtering (by date, route, status)
router.get('/payments', AdminController.getAllPayments);
router.get('/payments/stats', AdminController.getPaymentStats);
router.get('/payments/failures', AdminController.getPaymentFailureStats);

// System Management
router.get('/routes/stats', AdminController.getRouteStatistics);
router.get('/metrics', AdminController.getSystemMetrics);
router.get('/users', AdminController.getAllUsers);

// Revenue reporting
router.get('/revenue', AdminController.getRevenue);

// User Activity Tracking
router.get('/users/activity', AdminController.getUsersActivity);

// Vehicle Status and Occupancy Tracking
router.get('/vehicles/status', AdminController.getVehicleStatus);
router.get('/occupancy/details', AdminController.getOccupancyDetails);

// Activity Logs and Database Stats
router.get('/activity/logs', AdminController.getActivityLogs);
router.post('/activity/log', AdminController.logActivity);
router.get('/database/stats', AdminController.getDatabaseStats);

// WhatsApp joiners (users who sent join keyword)
router.get('/whatsapp/joiners', AdminController.getWhatsAppJoiners);
// WhatsApp participants from Twilio
router.get('/whatsapp/participants', AdminController.getWhatsAppParticipants);

module.exports = router;
