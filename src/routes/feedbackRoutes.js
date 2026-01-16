const express = require('express');
const FeedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dashboard)
router.get('/', FeedbackController.getUserFeedback);

// Protected routes
router.use(authMiddleware);

// FR1: Feedback submission (route, vehicle, feedback type, comment)
router.post('/', FeedbackController.submitFeedback);

// Get specific feedback
router.get('/:feedbackId', FeedbackController.getFeedbackById);

// Delete feedback
router.delete('/:feedbackId', FeedbackController.deleteFeedback);

module.exports = router;
