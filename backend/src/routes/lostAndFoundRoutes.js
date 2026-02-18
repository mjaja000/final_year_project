const express = require('express');
const router = express.Router();
const LostAndFoundController = require('../controllers/lostAndFoundController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Public routes (no authentication required)
router.post('/report', LostAndFoundController.createReport);

// Protected routes (authentication required)
router.get('/my-reports', authenticateToken, LostAndFoundController.getMyReports);

// Admin routes
router.get('/', authenticateToken, authorizeRoles('admin'), LostAndFoundController.getAllReports);
router.get('/stats', authenticateToken, authorizeRoles('admin'), LostAndFoundController.getStats);
router.get('/:id', authenticateToken, authorizeRoles('admin'), LostAndFoundController.getReportById);
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), LostAndFoundController.updateReportStatus);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), LostAndFoundController.deleteReport);

module.exports = router;
