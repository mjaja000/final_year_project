const express = require('express');
const ReportController = require('../controllers/reportController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
/**
 * POST /api/reports
 * Create a new report (General feedback or Incident)
 * Body: { matatuId, reportType, category?, rating?, comment?, userId? }
 */
router.post('/', ReportController.createReport);

/**
 * GET /api/reports/:reportId
 * Get a specific report by ID
 */
router.get('/:reportId', ReportController.getReportById);

/**
 * GET /api/reports/matatu/:matatuId
 * Get all reports for a matatu with optional filtering
 * Query: type (GENERAL|INCIDENT), limit, offset
 */
router.get('/matatu/:matatuId', ReportController.getMatatuReports);

/**
 * GET /api/reports/stats/:matatuId
 * Get performance statistics and health score for a matatu
 */
router.get('/stats/:matatuId', ReportController.getMatatuStats);

// Protected routes (require authentication)
router.use(authMiddleware);

/**
 * DELETE /api/reports/:reportId
 * Delete a report (requires authentication)
 */
router.delete('/:reportId', ReportController.deleteReport);

/**
 * GET /api/reports/analysis/high-risk
 * Get high-risk matatus (admin endpoint)
 */
router.get('/analysis/high-risk', ReportController.getHighRiskMatatus);

module.exports = router;
