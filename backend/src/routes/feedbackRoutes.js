const express = require('express');
const FeedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dashboard)
router.get('/', FeedbackController.getAllPublic);
router.post('/', FeedbackController.submitFeedback);
router.get('/:feedbackId', FeedbackController.getFeedbackById);

// Protected routes
router.use(authMiddleware);

// Delete feedback
router.delete('/:feedbackId', FeedbackController.deleteFeedback);

module.exports = router;
