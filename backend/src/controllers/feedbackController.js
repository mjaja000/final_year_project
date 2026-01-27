const FeedbackModel = require('../models/feedbackModel');
const SmsService = require('../services/smsService');
const WhatsappService = require('../services/whatsappService');

class FeedbackController {
  // Submit feedback (FR1: route, vehicle, feedback type, comment)
  static async submitFeedback(req, res) {
    try {
      const userId = req.userId || null;
      const { routeId, vehicleId, feedbackType, comment, phoneNumber } = req.body;

      // Validate required fields
      if (!routeId || !vehicleId || !feedbackType || !comment) {
        return res.status(400).json({ 
          message: 'Missing required fields: routeId, vehicleId, feedbackType, comment' 
        });
      }

      // Validate feedback type (must be Complaint or Compliment)
      if (!['Complaint', 'Compliment'].includes(feedbackType)) {
        return res.status(400).json({ 
          message: 'Feedback type must be either "Complaint" or "Compliment"' 
        });
      }

      // Submit feedback to database
      const feedback = await FeedbackModel.submitFeedback(
        userId, 
        routeId, 
        vehicleId, 
        feedbackType, 
        comment
      );

      // Send SMS notification if phone number provided (FR4)
      if (phoneNumber) {
        try {
          await SmsService.sendSms(
            phoneNumber,
            `Thank you for your ${feedbackType.toLowerCase()} on route. Your feedback ID: ${feedback.id}`
          );
        } catch (smsError) {
          console.error('SMS notification failed:', smsError);
        }
      }

      res.status(201).json({
        message: 'Feedback submitted successfully',
        feedback,
        notificationSent: !!phoneNumber
      });
    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
    }
  }

  // Get user feedback
  static async getUserFeedback(req, res) {
    try {
      const userId = req.userId;
      const feedback = await FeedbackModel.getUserFeedback(userId);

      res.json({
        message: 'User feedback fetched',
        total: feedback.length,
        feedback,
      });
    } catch (error) {
      console.error('Get user feedback error:', error);
      res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
    }
  }

  // Public: list feedback (for dashboard)
  static async getAllPublic(req, res) {
    try {
      const feedback = await FeedbackModel.getAllFeedback(100, 0, {});
      res.json({
        message: 'Feedback fetched',
        total: feedback.length,
        feedback,
      });
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
    }
  }

  // Get feedback by ID
  static async getFeedbackById(req, res) {
    try {
      const { feedbackId } = req.params;
      const feedback = await FeedbackModel.getFeedbackById(feedbackId);

      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      res.json({
        message: 'Feedback fetched',
        feedback,
      });
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
    }
  }

  // Delete feedback
  static async deleteFeedback(req, res) {
    try {
      const userId = req.userId;
      const { feedbackId } = req.params;

      const feedback = await FeedbackModel.getFeedbackById(feedbackId);
      if (!feedback || feedback.user_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await FeedbackModel.deleteFeedback(feedbackId);

      res.json({ message: 'Feedback deleted successfully' });
    } catch (error) {
      console.error('Delete feedback error:', error);
      res.status(500).json({ message: 'Failed to delete feedback', error: error.message });
    }
  }
}

module.exports = FeedbackController;
