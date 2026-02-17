const FeedbackModel = require('../models/feedbackModel');
const PaymentModel = require('../models/paymentModel');
const UserModel = require('../models/userModel');
const RouteModel = require('../models/routeModel');
const VehicleModel = require('../models/vehicleModel');
const OccupancyModel = require('../models/occupancyModel');
const ActivityLogModel = require('../models/activityLogModel');
const DatabaseStatsModel = require('../models/databaseStatsModel');
const MessageModel = require('../models/messageModel');
const twilio = require('twilio');
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
        totalPayments: paymentStats.total_payments || 0,
        totalRevenue: paymentStats.total_revenue || 0,
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
        totalRevenue: 0,
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

  // Revenue aggregation for admin (by date range or preset)
  static async getRevenue(req, res) {
    try {
      const { startDate, endDate, period } = req.query;
      let start = startDate ? new Date(startDate) : null;
      let end = endDate ? new Date(endDate) : new Date();

      if (!start) {
        const now = new Date();
        if (period === 'day') {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === 'week') {
          const day = now.getDay();
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        } else if (period === 'month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          // default last 7 days
          start = new Date();
          start.setDate(start.getDate() - 7);
        }
      }

      // Ensure timezone-safe ISO strings for SQL
      const startIso = start.toISOString();
      const endIso = (end || new Date()).toISOString();

      // Total revenue and payment counts
      const revenueQuery = `
        SELECT COALESCE(SUM(amount),0)::numeric::float8 AS total_revenue,
               COUNT(*) as payments_count
        FROM payments
        WHERE status = 'completed' AND created_at >= $1 AND created_at <= $2;
      `;

      const routeBreakdownQuery = `
        SELECT r.id, r.route_name, COALESCE(SUM(p.amount),0)::numeric::float8 AS revenue, COUNT(p.id) as payments_count
        FROM routes r
        LEFT JOIN payments p ON p.route_id = r.id AND p.status = 'completed' AND p.created_at >= $1 AND p.created_at <= $2
        GROUP BY r.id, r.route_name
        ORDER BY revenue DESC;
      `;

      const bookingsQuery = `
        SELECT COUNT(*) as bookings_count
        FROM bookings
        WHERE created_at >= $1 AND created_at <= $2;
      `;

      const revenueResult = await pool.query(revenueQuery, [startIso, endIso]);
      const breakdownResult = await pool.query(routeBreakdownQuery, [startIso, endIso]);
      const bookingsResult = await pool.query(bookingsQuery, [startIso, endIso]);

      res.json({
        message: 'Revenue summary fetched',
        period: { start: startIso, end: endIso },
        total_revenue: revenueResult.rows[0].total_revenue || 0,
        payments_count: Number(revenueResult.rows[0].payments_count || 0),
        bookings_count: Number(bookingsResult.rows[0].bookings_count || 0),
        revenue_by_route: breakdownResult.rows || []
      });
    } catch (error) {
      console.error('Get revenue error:', error);
      res.status(500).json({ message: 'Failed to fetch revenue', error: error.message });
    }
  }

  // Get route statistics and top routes
  static async getRouteStatistics(req, res) {
    try {
      const routes = await RouteModel.getAllRoutes();
      const topRoutes = routes.map(route => ({
        ...route,
        vehicles_count: 0, // Will be populated from vehicles
        occupancy: 'N/A'
      })).slice(0, 5);

      res.json({
        message: 'Route statistics retrieved',
        totalRoutes: routes.length || 0,
        activeRoutes: routes.filter(r => r.status === 'active').length || 0,
        topRoutes,
      });
    } catch (error) {
      console.error('Get route statistics error:', error);
      res.status(500).json({ message: 'Failed to fetch route statistics', error: error.message });
    }
  }

  // Get payment failure statistics
  static async getPaymentFailureStats(req, res) {
    try {
      const failures = await PaymentModel.getFailureStatistics();

      res.json({
        message: 'Payment failure statistics retrieved',
        failures: failures || [],
        totalFailures: failures.reduce((sum, f) => sum + (f.count || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Get payment failure stats error:', error);
      res.status(500).json({ message: 'Failed to fetch failure statistics', error: error.message });
    }
  }

  // Update feedback status (for admin review)
  static async updateFeedbackStatus(req, res) {
    try {
      const { feedbackId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const feedback = await FeedbackModel.updateFeedbackStatus(feedbackId, status);
      
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      res.json({
        message: 'Feedback status updated',
        feedback,
      });
    } catch (error) {
      console.error('Update feedback status error:', error);
      res.status(500).json({ message: 'Failed to update feedback status', error: error.message });
    }
  }

  // Get system performance metrics
  static async getSystemMetrics(req, res) {
    try {
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      
      res.json({
        message: 'System metrics retrieved',
        serverUptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
          rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get system metrics error:', error);
      res.status(500).json({ message: 'Failed to fetch system metrics', error: error.message });
    }
  }

  // Get all users with detailed information
  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers();

      res.json({
        message: 'All users fetched',
        total: users.length || 0,
        users: users || [],
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  }

  // Get users with activity tracking
  static async getUsersActivity(req, res) {
    try {
      const users = await UserModel.getUsersWithActivity();
      const onlineCount = await UserModel.getOnlineUsersCount();

      res.json({
        message: 'Users activity fetched',
        online_users: onlineCount || 0,
        total_users: users.length || 0,
        users: users || [],
      });
    } catch (error) {
      console.error('Get users activity error:', error);
      res.status(500).json({ message: 'Failed to fetch users activity', error: error.message });
    }
  }

  // Get vehicle status and occupancy
  static async getVehicleStatus(req, res) {
    try {
      const vehiclesSummary = await VehicleModel.getVehicleStatusSummary();
      const vehiclesWithOccupancy = await VehicleModel.getVehiclesWithOccupancy();

      res.json({
        message: 'Vehicle status fetched',
        summary: vehiclesSummary,
        vehicles: vehiclesWithOccupancy || [],
      });
    } catch (error) {
      console.error('Get vehicle status error:', error);
      res.status(500).json({ message: 'Failed to fetch vehicle status', error: error.message });
    }
  }

  // Get occupancy with route details
  static async getOccupancyDetails(req, res) {
    try {
      const occupancy = await OccupancyModel.getAllOccupancyStatuses();

      res.json({
        message: 'Occupancy details fetched',
        total: occupancy.length || 0,
        occupancy: occupancy || [],
      });
    } catch (error) {
      console.error('Get occupancy details error:', error);
      res.status(500).json({ message: 'Failed to fetch occupancy details', error: error.message });
    }
  }

  // Get activity logs
  static async getActivityLogs(req, res) {
    try {
      const limit = req.query.limit || 50;
      const logs = await ActivityLogModel.getSystemEvents(limit);
      const summary = await ActivityLogModel.getActivitySummary(24);

      res.json({
        message: 'Activity logs fetched',
        total: logs.length || 0,
        logs: logs || [],
        summary: summary || [],
      });
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
    }
  }

  // Get WhatsApp joiners (users who sent the join keyword)
  static async getWhatsAppJoiners(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 200;
      const joiners = await MessageModel.listWhatsAppJoiners(limit);

      res.json({
        message: 'WhatsApp joiners fetched',
        total: joiners.length || 0,
        joiners: joiners || []
      });
    } catch (error) {
      console.error('Get WhatsApp joiners error:', error.message);
      res.status(500).json({ message: 'Failed to fetch WhatsApp joiners', error: error.message });
    }
  }

  // Get WhatsApp participants from Twilio (unique inbound senders)
  static async getWhatsAppParticipants(req, res) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

      if (!accountSid || !authToken) {
        return res.status(500).json({ message: 'Twilio credentials not configured' });
      }

      const limit = parseInt(req.query.limit, 10) || 200;
      const client = twilio(accountSid, authToken);
      const messages = await client.messages.list({ to: whatsappNumber, limit });

      const normalize = (value) => String(value || '').replace(/[^0-9]/g, '');
      const latestByPhone = new Map();

      messages.forEach((msg) => {
        if (msg.direction && msg.direction !== 'inbound') return;
        const phone = normalize(msg.from);
        if (!phone) return;
        const existing = latestByPhone.get(phone);
        const createdAt = msg.dateCreated ? new Date(msg.dateCreated) : null;
        if (!existing || (createdAt && new Date(existing.last_message_at) < createdAt)) {
          latestByPhone.set(phone, {
            phone,
            last_message_at: createdAt ? createdAt.toISOString() : null
          });
        }
      });

      const participants = Array.from(latestByPhone.values()).sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      res.json({
        message: 'WhatsApp participants fetched from Twilio',
        total: participants.length,
        participants
      });
    } catch (error) {
      console.error('Get WhatsApp participants error:', error.message);
      res.status(500).json({ message: 'Failed to fetch WhatsApp participants', error: error.message });
    }
  }

  // Get database statistics and health
  static async getDatabaseStats(req, res) {
    try {
      const health = await DatabaseStatsModel.getDatabaseHealth();
      const backupInfo = await DatabaseStatsModel.getBackupInfo();

      res.json({
        message: 'Database statistics fetched',
        health,
        backup_info: backupInfo,
      });
    } catch (error) {
      console.error('Get database stats error:', error);
      res.status(500).json({ message: 'Failed to fetch database statistics', error: error.message });
    }
  }

  // Log a system activity
  static async logActivity(req, res) {
    try {
      const { userId, actionType, resourceType, resourceId, details, ipAddress } = req.body;

      if (!actionType) {
        return res.status(400).json({ message: 'actionType is required' });
      }

      const log = await ActivityLogModel.logActivity(
        userId,
        actionType,
        resourceType,
        resourceId,
        details,
        ipAddress || req.ip
      );

      res.json({
        message: 'Activity logged',
        log,
      });
    } catch (error) {
      console.error('Log activity error:', error);
      res.status(500).json({ message: 'Failed to log activity', error: error.message });
    }
  }
}

module.exports = AdminController;
