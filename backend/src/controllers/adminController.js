const FeedbackModel = require('../models/feedbackModel');
const PaymentModel = require('../models/paymentModel');
const UserModel = require('../models/userModel');
const RouteModel = require('../models/routeModel');
const VehicleModel = require('../models/vehicleModel');
const OccupancyModel = require('../models/occupancyModel');
const ActivityLogModel = require('../models/activityLogModel');
const DatabaseStatsModel = require('../models/databaseStatsModel');
const MessageModel = require('../models/messageModel');
const ReportService = require('../services/reportService');
const SaccoSettingsModel = require('../models/saccoSettingsModel');
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
        station: req.query.station,
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

  // Get all reports from complaint-demo for admin dashboard
  static async getAllReports(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const result = await ReportService.getAllReports({
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get all reports error:', error);
      res.status(error.statusCode || 500).json({
        message: error.message || 'Failed to fetch reports',
        error: error.message,
      });
    }
  }

  // Get all unique station names (derived from route start/end locations)
  static async getStations(req, res) {
    try {
      const result = await pool.query(`
        SELECT DISTINCT name FROM (
          SELECT start_location AS name FROM routes WHERE status != 'inactive'
          UNION
          SELECT end_location AS name FROM routes WHERE status != 'inactive'
        ) AS stations
        ORDER BY name
      `);
      res.json({ stations: result.rows.map(r => r.name) });
    } catch (error) {
      console.error('Get stations error:', error);
      res.status(500).json({ message: 'Failed to fetch stations', error: error.message });
    }
  }

  // Get SACCO settings (public)
  static async getSettings(req, res) {
    try {
      const settings = await SaccoSettingsModel.getAll();
      const obj = {};
      settings.forEach(s => { obj[s.key] = s.value; });
      res.json(obj);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
    }
  }

  // Update SACCO settings (admin only)
  static async updateSettings(req, res) {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ message: 'key and value are required' });
      }
      const updated = await SaccoSettingsModel.set(key, value);
      res.json({ message: 'Setting updated', setting: updated });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'Failed to update setting', error: error.message });
    }
  }

  // Manual payment processing (admin creates payment for station customer)
  static async createManualPayment(req, res) {
    try {
      const { routeId, phoneNumber, amount, paymentMethod, station } = req.body;

      // Validate input
      if (!routeId || !phoneNumber || !amount) {
        return res.status(400).json({ message: 'Missing required fields: routeId, phoneNumber, amount' });
      }

      // Validate phone number
      const { validatePhoneOrThrow, normalizeKenyanPhone } = require('../utils/phoneValidation');
      try {
        validatePhoneOrThrow(phoneNumber);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }

      const normalizedPhone = normalizeKenyanPhone(phoneNumber);

      // Get active vehicle for this route to link payment
      const VehicleModel = require('../models/vehicleModel');
      const activeVehicle = await VehicleModel.getActiveVehicleForRoute(routeId);
      
      if (!activeVehicle) {
        return res.status(400).json({ message: 'No active vehicle available for this route' });
      }

      // Generate transaction ID
      const transactionId = `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create payment record with vehicle_id
      const insertQuery = `
        INSERT INTO payments (
          route_id, phone_number, amount, status, payment_method, transaction_id, vehicle_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;

      const result = await pool.query(insertQuery, [
        routeId,
        normalizedPhone,
        amount,
        'completed', // Admin payments are pre-completed
        paymentMethod || 'cash',
        transactionId,
        activeVehicle.id
      ]);

      const payment = result.rows[0];

      // Increment vehicle occupancy
      const occupancyQuery = `
        INSERT INTO vehicle_occupancy (vehicle_id, current_occupancy, occupancy_status)
        VALUES ($1, 1, CASE WHEN 1 >= $2 THEN 'full' ELSE 'available' END)
        ON CONFLICT (vehicle_id)
        DO UPDATE SET
          current_occupancy = vehicle_occupancy.current_occupancy + 1,
          occupancy_status = CASE
            WHEN vehicle_occupancy.current_occupancy + 1 >= $2 THEN 'full'
            ELSE 'available'
          END,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      await pool.query(occupancyQuery, [activeVehicle.id, activeVehicle.capacity]);

      // Get route details for WhatsApp
      const route = await RouteModel.getRouteById(routeId);

      // Send WhatsApp confirmation
      try {
        const whatsappService = require('../services/whatsappService');
        const saccoName = await SaccoSettingsModel.get('sacco_name') || 'MatatuConnect';
        const message = `Payment confirmed! Route: ${route?.route_name || 'N/A'}, Amount: KSh ${amount}, Transaction: ${transactionId}. Thank you for using ${saccoName}!`;
        
        await whatsappService.sendMessage(normalizedPhone, message);
      } catch (whatsappErr) {
        console.error('WhatsApp notification failed:', whatsappErr.message);
        // Don't fail the whole request if WhatsApp fails
      }

      res.json({
        message: 'Payment recorded successfully',
        payment,
        route,
        transactionId,
        station: station || null,
        vehicle: {
          id: activeVehicle.id,
          registration_number: activeVehicle.registration_number,
          current_occupancy: (activeVehicle.current_occupancy || 0) + 1,
          capacity: activeVehicle.capacity
        }
      });

    } catch (error) {
      console.error('Manual payment error:', error.message);
      res.status(500).json({ message: 'Failed to process payment', error: error.message });
    }
  }

  // Payment Analytics - Comprehensive payment analysis
  static async getPaymentAnalytics(req, res) {
    try {
      const { startDate, endDate, station, period = 'daily' } = req.query;

      // Build date filter
      let dateFilter = '';
      const params = [];
      let paramIndex = 1;

      if (startDate) {
        dateFilter += ` AND p.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        dateFilter += ` AND p.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Total Revenue & Payment Counts
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_count,
          COUNT(CASE WHEN payment_method = 'mpesa' THEN 1 END) as mpesa_count,
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_revenue,
          COALESCE(SUM(CASE WHEN payment_method = 'mpesa' THEN amount ELSE 0 END), 0) as mpesa_revenue,
          COALESCE(AVG(amount), 0) as average_payment
        FROM payments p
        WHERE status = 'completed' ${dateFilter}
      `;

      const summaryResult = await pool.query(summaryQuery, params);
      const summary = summaryResult.rows[0];

      // Payment Trends Over Time
      let groupByClause = '';
      if (period === 'hourly') {
        groupByClause = "DATE_TRUNC('hour', p.created_at)";
      } else if (period === 'daily') {
        groupByClause = "DATE_TRUNC('day', p.created_at)";
      } else if (period === 'weekly') {
        groupByClause = "DATE_TRUNC('week', p.created_at)";
      } else if (period === 'monthly') {
        groupByClause = "DATE_TRUNC('month', p.created_at)";
      } else {
        groupByClause = "DATE_TRUNC('day', p.created_at)";
      }

      const trendsQuery = `
        SELECT 
          ${groupByClause} as period,
          COUNT(*) as payment_count,
          COALESCE(SUM(amount), 0) as revenue
        FROM payments p
        WHERE status = 'completed' ${dateFilter}
        GROUP BY ${groupByClause}
        ORDER BY period ASC
        LIMIT 100
      `;

      const trendsResult = await pool.query(trendsQuery, params);
      const trends = trendsResult.rows;

      // Route-wise Revenue
      const routeRevenueQuery = `
        SELECT 
          r.id as route_id,
          r.route_name,
          r.start_location,
          r.end_location,
          COUNT(p.id) as payment_count,
          COALESCE(SUM(p.amount), 0) as total_revenue,
          COALESCE(AVG(p.amount), 0) as average_fare
        FROM payments p
        JOIN routes r ON p.route_id = r.id
        WHERE p.status = 'completed' ${dateFilter}
        GROUP BY r.id, r.route_name, r.start_location, r.end_location
        ORDER BY total_revenue DESC
        LIMIT 20
      `;

      const routeRevenueResult = await pool.query(routeRevenueQuery, params);
      const routeRevenue = routeRevenueResult.rows;

      // Station-wise Revenue (if applicable)
      let stationRevenue = [];
      if (!station) {
        const stationRevenueQuery = `
          SELECT 
            r.start_location as station,
            COUNT(p.id) as payment_count,
            COALESCE(SUM(p.amount), 0) as total_revenue
          FROM payments p
          JOIN routes r ON p.route_id = r.id
          WHERE p.status = 'completed' ${dateFilter}
          GROUP BY r.start_location
          ORDER BY total_revenue DESC
        `;

        const stationRevenueResult = await pool.query(stationRevenueQuery, params);
        stationRevenue = stationRevenueResult.rows;
      }

      // Payment Method Breakdown
      const paymentMethodBreakdown = {
        cash: {
          count: parseInt(summary.cash_count || 0),
          revenue: parseFloat(summary.cash_revenue || 0),
          percentage: summary.total_revenue > 0 
            ? (parseFloat(summary.cash_revenue || 0) / parseFloat(summary.total_revenue)) * 100 
            : 0
        },
        mpesa: {
          count: parseInt(summary.mpesa_count || 0),
          revenue: parseFloat(summary.mpesa_revenue || 0),
          percentage: summary.total_revenue > 0 
            ? (parseFloat(summary.mpesa_revenue || 0) / parseFloat(summary.total_revenue)) * 100 
            : 0
        }
      };

      res.json({
        summary: {
          totalPayments: parseInt(summary.total_payments || 0),
          totalRevenue: parseFloat(summary.total_revenue || 0),
          averagePayment: parseFloat(summary.average_payment || 0)
        },
        paymentMethodBreakdown,
        trends: trends.map(t => ({
          period: t.period,
          paymentCount: parseInt(t.payment_count || 0),
          revenue: parseFloat(t.revenue || 0)
        })),
        routeRevenue: routeRevenue.map(r => ({
          routeId: r.route_id,
          routeName: r.route_name,
          startLocation: r.start_location,
          endLocation: r.end_location,
          paymentCount: parseInt(r.payment_count || 0),
          totalRevenue: parseFloat(r.total_revenue || 0),
          averageFare: parseFloat(r.average_fare || 0)
        })),
        stationRevenue: stationRevenue.map(s => ({
          station: s.station,
          paymentCount: parseInt(s.payment_count || 0),
          totalRevenue: parseFloat(s.total_revenue || 0)
        }))
      });

    } catch (error) {
      console.error('Payment analytics error:', error.message);
      res.status(500).json({ message: 'Failed to fetch payment analytics', error: error.message });
    }
  }

  // Get active vehicle for a route
  static async getActiveVehicleForRoute(req, res) {
    try {
      const { routeId } = req.params;
      const VehicleModel = require('../models/vehicleModel');
      
      const activeVehicle = await VehicleModel.getActiveVehicleForRoute(routeId);
      
      if (!activeVehicle) {
        return res.json({ vehicle: null, message: 'No active vehicle available for this route' });
      }

      res.json({ 
        vehicle: {
          id: activeVehicle.id,
          registration_number: activeVehicle.registration_number,
          vehicle_type: activeVehicle.vehicle_type,
          make: activeVehicle.make,
          model: activeVehicle.model,
          color: activeVehicle.color,
          capacity: activeVehicle.capacity,
          current_occupancy: activeVehicle.current_occupancy || 0
        }
      });
    } catch (error) {
      console.error('Error fetching active vehicle:', error.message);
      res.status(500).json({ message: 'Failed to fetch active vehicle', error: error.message });
    }
  }

  // Get comprehensive occupancy overview for station
  static async getOccupancyOverview(req, res) {
    try {
      const { station } = req.query;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Get all routes (filter by station if provided)
      let routesQuery = `
        SELECT id, route_name, start_location, end_location, fare, distance
        FROM routes
        WHERE 1=1
      `;
      const routesParams = [];
      
      if (station) {
        routesQuery += ` AND (start_location = $1 OR end_location = $1)`;
        routesParams.push(station);
      }
      
      routesQuery += ` ORDER BY route_name`;
      const routesResult = await pool.query(routesQuery, routesParams);
      const routes = routesResult.rows;

      // 2. Get all vehicles with their occupancy and driver info
      const vehiclesQuery = `
        SELECT 
          v.id,
          v.registration_number,
          v.vehicle_type,
          v.make,
          v.model,
          v.color,
          v.capacity,
          v.route_id,
          v.status,
          r.route_name,
          r.start_location,
          r.end_location,
          vo.current_occupancy,
          vo.occupancy_status,
          vo.updated_at as occupancy_updated_at,
          u.name as driver_name,
          u.phone as driver_phone,
          d.status as driver_status
        FROM vehicles v
        LEFT JOIN routes r ON v.route_id = r.id
        LEFT JOIN vehicle_occupancy vo ON v.id = vo.vehicle_id
        LEFT JOIN drivers d ON v.id = d.assigned_vehicle_id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE v.status = 'active'
        ORDER BY v.route_id, v.id
      `;
      const vehiclesResult = await pool.query(vehiclesQuery);
      const vehicles = vehiclesResult.rows;

      // 3. Get today's revenue by route
      const revenueQuery = `
        SELECT 
          r.id as route_id,
          r.route_name,
          COUNT(p.id) as total_trips,
          SUM(p.amount) as total_revenue,
          COUNT(DISTINCT p.vehicle_id) as active_vehicles
        FROM routes r
        LEFT JOIN payments p ON r.id = p.route_id 
          AND p.status = 'completed' 
          AND p.created_at >= $1
        GROUP BY r.id, r.route_name
        ORDER BY total_revenue DESC NULLS LAST
      `;
      const revenueResult = await pool.query(revenueQuery, [today]);
      const routeStats = revenueResult.rows;

      // 4. Get overall stats for today
      const overallStatsQuery = `
        SELECT 
          COUNT(DISTINCT p.route_id) as active_routes,
          COUNT(DISTINCT p.vehicle_id) as vehicles_used,
          COUNT(p.id) as total_trips,
          SUM(p.amount) as total_revenue,
          AVG(p.amount) as avg_trip_cost
        FROM payments p
        WHERE p.status = 'completed' AND p.created_at >= $1
      `;
      const overallStatsResult = await pool.query(overallStatsQuery, [today]);
      const overallStats = overallStatsResult.rows[0];

      // 5. Group vehicles by route with queue order
      const vehiclesByRoute = {};
      vehicles.forEach(vehicle => {
        const routeId = vehicle.route_id;
        if (!routeId) return;
        
        if (!vehiclesByRoute[routeId]) {
          vehiclesByRoute[routeId] = {
            route_name: vehicle.route_name,
            vehicles: []
          };
        }

        const currentOccupancy = vehicle.current_occupancy || 0;
        const capacity = vehicle.capacity || 14;
        const isFull = currentOccupancy >= capacity;
        const hasDriver = !!vehicle.driver_name;
        const isActive = currentOccupancy > 0 && currentOccupancy < capacity;

        vehiclesByRoute[routeId].vehicles.push({
          id: vehicle.id,
          registration_number: vehicle.registration_number,
          vehicle_type: vehicle.vehicle_type,
          make: vehicle.make,
          model: vehicle.model,
          color: vehicle.color,
          capacity: capacity,
          current_occupancy: currentOccupancy,
          occupancy_status: vehicle.occupancy_status || (isFull ? 'full' : (currentOccupancy > 0 ? 'filling' : 'empty')),
          driver_name: vehicle.driver_name,
          driver_phone: vehicle.driver_phone,
          driver_status: vehicle.driver_status,
          has_driver: hasDriver,
          is_filling: isActive,
          is_full: isFull,
          is_next_in_line: !isActive && !isFull && hasDriver,
          updated_at: vehicle.occupancy_updated_at
        });
      });

      // Sort vehicles within each route: filling first, then next in line, then others
      Object.keys(vehiclesByRoute).forEach(routeId => {
        vehiclesByRoute[routeId].vehicles.sort((a, b) => {
          if (a.is_filling && !b.is_filling) return -1;
          if (!a.is_filling && b.is_filling) return 1;
          if (a.is_next_in_line && !b.is_next_in_line) return -1;
          if (!a.is_next_in_line && b.is_next_in_line) return 1;
          return a.id - b.id;
        });
      });

      res.json({
        routes,
        vehiclesByRoute,
        routeStats,
        overallStats: {
          active_routes: parseInt(overallStats.active_routes) || 0,
          vehicles_used: parseInt(overallStats.vehicles_used) || 0,
          total_trips: parseInt(overallStats.total_trips) || 0,
          total_revenue: parseFloat(overallStats.total_revenue) || 0,
          avg_trip_cost: parseFloat(overallStats.avg_trip_cost) || 0
        },
        date: today.toISOString()
      });

    } catch (error) {
      console.error('Error fetching occupancy overview:', error.message);
      res.status(500).json({ message: 'Failed to fetch occupancy overview', error: error.message });
    }
  }
}

module.exports = AdminController;
