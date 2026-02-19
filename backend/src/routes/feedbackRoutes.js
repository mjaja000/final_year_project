const express = require('express');
const FeedbackController = require('../controllers/feedbackController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dashboard)
router.get('/', FeedbackController.getAllPublic);
router.post('/', FeedbackController.submitFeedback);
router.get('/:feedbackId', FeedbackController.getFeedbackById);

// Protected routes
router.use(authMiddleware);

// Delete feedback
router.delete('/:feedbackId', FeedbackController.deleteFeedback);

// Admin routes
router.get('/admin/ntsa-stats', authorizeRoles('admin'), FeedbackController.getNTSAStats);
router.post('/admin/ntsa-forward/:feedbackId', authorizeRoles('admin'), FeedbackController.forwardToNTSA);
router.post('/admin/whatsapp/:feedbackId/:phoneNumber?', authorizeRoles('admin'), FeedbackController.sendFeedbackWhatsApp);

module.exports = router;
