const ReportRepository = require('../repositories/reportRepository');
const NotificationService = require('./notificationService');
const { validateReport } = require('../schemas/reportSchema');

/**
 * ReportService - Business logic layer for report operations.
 * Handles validation, incident priority scoring, and notification triggering.
 */
class ReportService {
  /**
   * Create a new report with full validation and conditional notification.
   *
   * @param {Object} data - Report data from request
   * @param {string} data.matatuId - UUID of the matatu
   * @param {string} data.reportType - 'GENERAL' or 'INCIDENT'
   * @param {string} data.category - Category (required for INCIDENT)
   * @param {number} data.rating - Rating 1-5 (required for GENERAL)
   * @param {string} data.comment - Optional comment
   * @param {string} data.userId - Optional user ID
   * @returns {Promise<Object>} Created report with metadata
   */
  static async createReport(data) {
    try {
      // Validate using Zod schema
      const validatedData = validateReport(data);

      // Create report in database with transaction
      const report = await ReportRepository.createReport({
        userId: data.userId || null,
        matatuId: validatedData.matatuId,
        type: validatedData.type,
        category: validatedData.category || null,
        rating: validatedData.rating || null,
        comment: validatedData.comment || null,
      });

      // If INCIDENT: Calculate priority and trigger notification if needed
      if (validatedData.type === 'INCIDENT') {
        const existingIncidents = await ReportRepository.getHighPriorityIncidents(
          validatedData.matatuId
        );
        const priorityScore = NotificationService.calculatePriorityScore(
          validatedData.category,
          existingIncidents.length
        );

        // Trigger urgent alert if priority > 4
        if (priorityScore > 4) {
          await NotificationService.sendUrgentAlert({
            reportId: report.id,
            matatuId: report.matatu_id,
            category: report.category,
            priorityScore,
            comment: report.comment,
          });
        }

        return {
          success: true,
          data: report,
          incident: {
            priorityScore,
            alertTriggered: priorityScore > 4,
          },
        };
      }

      // For GENERAL reports, just return success
      return {
        success: true,
        data: report,
        incident: null,
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw {
          statusCode: 400,
          message: 'Validation error',
          errors: formattedErrors,
        };
      }

      throw {
        statusCode: 500,
        message: `Failed to create report: ${error.message}`,
      };
    }
  }

  /**
   * Get matatu performance statistics.
   *
   * @param {string} matatuId - UUID of the matatu
   * @returns {Promise<Object>} Performance stats and incident breakdown
   */
  static async getMatatuPerformance(matatuId) {
    try {
      const stats = await ReportRepository.getMatatuStats(matatuId);
      const categoryBreakdown = await ReportRepository.getIncidentCategoryBreakdown(
        matatuId
      );

      // Calculate health score (0-100)
      let healthScore = 100;

      // Deduct based on average rating
      if (stats.average_rating) {
        healthScore -= (5 - stats.average_rating) * 10;
      }

      // Deduct based on incident count
      healthScore -= Math.min(stats.incident_count * 5, 40);

      healthScore = Math.max(0, Math.min(100, healthScore));

      return {
        success: true,
        data: {
          matatuId,
          stats,
          categoryBreakdown,
          healthScore: Math.round(healthScore),
          riskLevel:
            healthScore >= 80 ? 'LOW' : healthScore >= 50 ? 'MEDIUM' : 'HIGH',
        },
      };
    } catch (error) {
      throw {
        statusCode: 500,
        message: `Failed to get matatu performance: ${error.message}`,
      };
    }
  }

  /**
   * Get reports for a matatu with optional filtering.
   *
   * @param {string} matatuId - UUID of the matatu
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Reports and metadata
   */
  static async getMatatuReports(matatuId, options = {}) {
    try {
      const result = await ReportRepository.getMatatuReports(matatuId, options);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw {
        statusCode: 500,
        message: `Failed to retrieve reports: ${error.message}`,
      };
    }
  }

  /**
   * Get a single report by ID.
   *
   * @param {string} reportId - UUID of the report
   * @returns {Promise<Object>} Report data
   */
  static async getReportById(reportId) {
    try {
      const report = await ReportRepository.getReportById(reportId);

      if (!report) {
        throw {
          statusCode: 404,
          message: 'Report not found',
        };
      }

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw {
        statusCode: 500,
        message: `Failed to retrieve report: ${error.message}`,
      };
    }
  }

  /**
   * Delete a report by ID.
   *
   * @param {string} reportId - UUID of the report
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteReport(reportId) {
    try {
      const deleted = await ReportRepository.deleteReport(reportId);

      if (!deleted) {
        throw {
          statusCode: 404,
          message: 'Report not found',
        };
      }

      return {
        success: true,
        message: 'Report deleted successfully',
        reportId,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw {
        statusCode: 500,
        message: `Failed to delete report: ${error.message}`,
      };
    }
  }

  /**
   * Get high-risk matatus (threshold: health score < 50).
   * Useful for admin dashboard.
   *
   * @returns {Promise<Array>} List of high-risk matatus (simulated)
   */
  static async getHighRiskMatatus() {
    try {
      // This would typically query a view or aggregate multiple matatu stats
      // For now, returning a placeholder structure
      return {
        success: true,
        data: {
          message: 'High-risk matatus endpoint - implement based on your dashboard needs',
          example: [
            {
              matatuId: 'uuid-1',
              riskLevel: 'HIGH',
              healthScore: 35,
              incident_count: 12,
              average_rating: 2.5,
            },
          ],
        },
      };
    } catch (error) {
      throw {
        statusCode: 500,
        message: `Failed to get high-risk matatus: ${error.message}`,
      };
    }
  }
}

module.exports = ReportService;
