const express = require('express');
const AdminController = require('../controllers/adminController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
const adminOnly = [authMiddleware, authorizeRoles(['admin'])];

// Database health check
router.get('/health/db', AdminController.checkDatabaseHealth);

// FR5: Admin Dashboard Overview
router.get('/dashboard', adminOnly, AdminController.getDashboardOverview);

// FR5: Feedback Management with filtering (by date, route, vehicle)
router.get('/feedback', adminOnly, AdminController.getAllFeedback);
router.get('/feedback/stats', adminOnly, AdminController.getFeedbackStats);
router.put('/feedback/:feedbackId/status', adminOnly, AdminController.updateFeedbackStatus);

// Reports from complaint-demo (separate table)
router.get('/reports', adminOnly, AdminController.getAllReports);

// FR5: Payment Management with filtering (by date, route, status)
router.get('/payments', adminOnly, AdminController.getAllPayments);
router.get('/payments/stats', adminOnly, AdminController.getPaymentStats);
router.get('/payments/failures', adminOnly, AdminController.getPaymentFailureStats);

// System Management
router.get('/routes/stats', adminOnly, AdminController.getRouteStatistics);
router.get('/metrics', adminOnly, AdminController.getSystemMetrics);
router.get('/users', adminOnly, AdminController.getAllUsers);

// Revenue reporting
router.get('/revenue', adminOnly, AdminController.getRevenue);

// User Activity Tracking
router.get('/users/activity', adminOnly, AdminController.getUsersActivity);

// Vehicle Status and Occupancy Tracking
router.get('/vehicles/status', adminOnly, AdminController.getVehicleStatus);
router.get('/occupancy/details', adminOnly, AdminController.getOccupancyDetails);

// Activity Logs and Database Stats
router.get('/activity/logs', adminOnly, AdminController.getActivityLogs);
router.post('/activity/log', adminOnly, AdminController.logActivity);
router.get('/database/stats', adminOnly, AdminController.getDatabaseStats);

// WhatsApp joiners (users who sent join keyword)
router.get('/whatsapp/joiners', adminOnly, AdminController.getWhatsAppJoiners);
// WhatsApp participants from Twilio
router.get('/whatsapp/participants', adminOnly, AdminController.getWhatsAppParticipants);

// Stations (derived from routes)
router.get('/stations', adminOnly, AdminController.getStations);

// SACCO Settings - GET is public, PUT is admin only
router.get('/settings', AdminController.getSettings);
router.put('/settings', adminOnly, AdminController.updateSettings);

// Manual Payment
router.post('/manual-payment', adminOnly, AdminController.createManualPayment);

// Payment Analytics
router.get('/payment-analytics', adminOnly, AdminController.getPaymentAnalytics);

// Get active vehicle for route
router.get('/routes/:routeId/active-vehicle', adminOnly, AdminController.getActiveVehicleForRoute);

module.exports = router;
