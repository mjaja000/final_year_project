const ReportService = require('../services/reportService');

/**
 * ReportController - Handles HTTP requests and responses for report operations.
 * Includes comprehensive error handling and parameter validation.
 */
class ReportController {
  /**
   * Create a new report (POST /api/reports)
   * Body: { matatuId, reportType, category?, rating?, comment?, userId? }
   */
  static async createReport(req, res, next) {
    try {
      const { matatuId, reportType, category, rating, comment, userId } = req.body;

      // Basic validation
      if (!matatuId || !reportType) {
        return res.status(400).json({
          message: 'Missing required fields: matatuId, reportType',
        });
      }

      // Call service
      const result = await ReportService.createReport({
        matatuId,
        reportType,
        category,
        rating,
        comment,
        userId: userId || req.userId || null, // Use auth token user ID if available
      });

      res.status(201).json({
        message: 'Report submitted successfully',
        ...result,
      });
    } catch (error) {
      console.error('Create report error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
          errors: error.errors || undefined,
        });
      }

      res.status(500).json({
        message: 'Failed to create report',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  }

  /**
   * Get matatu performance stats (GET /api/reports/stats/:matatuId)
   */
  static async getMatatuStats(req, res, next) {
    try {
      const { matatuId } = req.params;

      if (!matatuId) {
        return res.status(400).json({
          message: 'Missing required parameter: matatuId',
        });
      }

      const result = await ReportService.getMatatuPerformance(matatuId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Get matatu stats error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: 'Failed to retrieve matatu statistics',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  }

  /**
   * Get all reports for a matatu (GET /api/reports/matatu/:matatuId)
   * Query params: type (GENERAL|INCIDENT), limit, offset
   */
  static async getMatatuReports(req, res, next) {
    try {
      const { matatuId } = req.params;
      const { type, limit = 50, offset = 0 } = req.query;

      if (!matatuId) {
        return res.status(400).json({
          message: 'Missing required parameter: matatuId',
        });
      }

      // Validate type filter if provided
      if (type && !['GENERAL', 'INCIDENT'].includes(type)) {
        return res.status(400).json({
          message: 'Invalid type filter. Must be GENERAL or INCIDENT',
        });
      }

      // Validate pagination
      const parsedLimit = Math.min(parseInt(limit) || 50, 100); // Max 100 per request
      const parsedOffset = parseInt(offset) || 0;

      const result = await ReportService.getMatatuReports(matatuId, {
        type: type || null,
        limit: parsedLimit,
        offset: parsedOffset,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Get matatu reports error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: 'Failed to retrieve reports',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  }

  /**
   * Get a single report (GET /api/reports/:reportId)
   */
  static async getReportById(req, res, next) {
    try {
      const { reportId } = req.params;

      if (!reportId) {
        return res.status(400).json({
          message: 'Missing required parameter: reportId',
        });
      }

      const result = await ReportService.getReportById(reportId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Get report by ID error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: 'Failed to retrieve report',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  }

  /**
   * Delete a report (DELETE /api/reports/:reportId)
   * Requires authentication
   */
  static async deleteReport(req, res, next) {
    try {
      const { reportId } = req.params;

      if (!reportId) {
        return res.status(400).json({
          message: 'Missing required parameter: reportId',
        });
      }

      const result = await ReportService.deleteReport(reportId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Delete report error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: 'Failed to delete report',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  }

  /**
   * Get high-risk matatus (GET /api/reports/analysis/high-risk)
   * Admin endpoint
   */
  static async getHighRiskMatatus(req, res, next) {
    try {
      const result = await ReportService.getHighRiskMatatus();
      res.status(200).json(result);
    } catch (error) {
      console.error('Get high-risk matatus error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: 'Failed to retrieve high-risk matatus',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  }
}

module.exports = ReportController;
