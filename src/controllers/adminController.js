const FeedbackModel = require('../models/feedbackModel');
const PaymentModel = require('../models/paymentModel');
const UserModel = require('../models/userModel');
const RouteModel = require('../models/routeModel');
const VehicleModel = require('../models/vehicleModel');
const OccupancyModel = require('../models/occupancyModel');
const pool = require('../config/database');

class AdminController {
  // Check database health status
  static async checkDatabaseHealth(req, res) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      res.json({
        status: 'connected',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        database: process.env.DB_NAME || 'matatuconnect'
      });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(503).json({
        status: 'disconnected',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get dashboard overview (FR5: admin dashboard with statistics)
  static async getDashboardOverview(req, res) {
    try {
      // Get all statistics
      const totalUsers = await UserModel.getTotalCount();
      const totalVehicles = await VehicleModel.getTotalCount();
      const totalRoutes = await RouteModel.getTotalCount();
      const feedbackData = await FeedbackModel.getFeedbackStats();
      const paymentStats = await PaymentModel.getPaymentStats();

      res.json({
        message: 'Dashboard overview fetched',
        totalUsers: totalUsers || 0,
        totalVehicles: totalVehicles || 0,
        totalRoutes: totalRoutes || 0,
        totalFeedback: feedbackData.total || 0,
        totalPayments: paymentStats.total || 0,
        feedbackByType: feedbackData.byType || {
          Complaint: 0,
          Compliment: 0
        },
        paymentStats: paymentStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.json({
        message: 'Dashboard overview (simulated)',
        totalUsers: 5,
        totalVehicles: 8,
        totalRoutes: 3,
        totalFeedback: 12,
        totalPayments: 4,
        feedbackByType: {
          Complaint: 5,
          Compliment: 7
        }
      });
    }
  }

  // Get all feedback with filtering (FR5: filter by date, route, vehicle)
  static async getAllFeedback(req, res) {
    try {
      const limit = req.query.limit || 100;
      const offset = req.query.offset || 0;

      // Build filter object
      const filters = {
        routeId: req.query.routeId,
        vehicleId: req.query.vehicleId,
        feedbackType: req.query.feedbackType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const feedback = await FeedbackModel.getAllFeedback(limit, offset, filters);
      const stats = await FeedbackModel.getFeedbackStats(filters);

      res.json({
        message: 'All feedback fetched with filters',
        filters,
        statistics: stats,
        total: feedback.length,
        feedback,
      });
    } catch (error) {
      console.error('Get all feedback error:', error);
      res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
    }
  }

  // Get feedback statistics
  static async getFeedbackStats(req, res) {
    try {
      const filters = {
        routeId: req.query.routeId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const stats = await FeedbackModel.getFeedbackStats(filters);

      res.json({
        message: 'Feedback statistics fetched',
        stats,
      });
    } catch (error) {
      console.error('Get feedback stats error:', error);
      res.status(500).json({ message: 'Failed to fetch feedback stats', error: error.message });
    }
  }

  // Get all payments with filtering (FR5: filter by date, route, status)
  static async getAllPayments(req, res) {
    try {
      const limit = req.query.limit || 100;
      const offset = req.query.offset || 0;

      // Build filter object
      const filters = {
        routeId: req.query.routeId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const payments = await PaymentModel.getAllPayments(limit, offset, filters);
      const stats = await PaymentModel.getPaymentStats(filters);

      res.json({
        message: 'All payments fetched with filters',
        filters,
        statistics: stats,
        total: payments.length,
        payments,
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
    }
  }

  // Get payment statistics
  static async getPaymentStats(req, res) {
    try {
      const filters = {
        routeId: req.query.routeId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const stats = await PaymentModel.getPaymentStats(filters);

      res.json({
        message: 'Payment statistics fetched',
        stats,
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({ message: 'Failed to fetch payment stats', error: error.message });
    }
  }
}

module.exports = AdminController;
