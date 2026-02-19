const pool = require('../config/database');

class FeedbackController {
  /**
   * Submit feedback - Simple, direct implementation
   * POST /api/feedback
   */
  static async submitFeedback(req, res) {
    const startTime = Date.now();
    console.log('\n[FEEDBACK API] ========================================');
    console.log('[FEEDBACK API] POST /api/feedback request received');
    console.log('[FEEDBACK API] Time:', new Date().toISOString());
    console.log('[FEEDBACK API] Body:', JSON.stringify(req.body, null, 2));

    try {
      const { routeId, vehicleId, feedbackType, comment, phoneNumber } = req.body;
      const userId = req.userId || null;

      // Validate required fields
      console.log('[FEEDBACK API] Validating fields...');
      if (!routeId || !vehicleId || !feedbackType || !comment) {
        console.error('[FEEDBACK API] Validation failed - Missing fields:', {
          routeId: !!routeId,
          vehicleId: !!vehicleId,
          feedbackType: !!feedbackType,
          comment: !!comment,
        });
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: routeId, vehicleId, feedbackType, comment',
          received: { routeId, vehicleId, feedbackType, comment }
        });
      }

      // Validate feedback type
      if (!['Complaint', 'Compliment'].includes(feedbackType)) {
        console.error('[FEEDBACK API] Invalid feedback type:', feedbackType);
        return res.status(400).json({
          success: false,
          message: 'Feedback type must be either "Complaint" or "Compliment"'
        });
      }

      console.log('[FEEDBACK API] Validation passed. Inserting into database...');

      // Insert directly using pool.query - simple and reliable
      const insertQuery = `
        INSERT INTO feedback (user_id, route_id, vehicle_id, feedback_type, comment, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
        RETURNING id, user_id, route_id, vehicle_id, feedback_type, comment, status, created_at, updated_at;
      `;

      const result = await pool.query(insertQuery, [
        userId,
        Number(routeId),
        Number(vehicleId),
        feedbackType,
        comment
      ]);

      const feedback = result.rows[0];
      console.log('[FEEDBACK API] ✓ Insert successful!');
      console.log('[FEEDBACK API] Feedback ID:', feedback.id);
      console.log('[FEEDBACK API] Duration:', Date.now() - startTime, 'ms');

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        feedback: {
          id: feedback.id,
          user_id: feedback.user_id,
          route_id: feedback.route_id,
          vehicle_id: feedback.vehicle_id,
          feedback_type: feedback.feedback_type,
          comment: feedback.comment,
          status: feedback.status,
          created_at: feedback.created_at,
          updated_at: feedback.updated_at
        },
        notificationsSent: {
          sms: false,
          whatsapp: false
        }
      });

    } catch (error) {
      console.error('[FEEDBACK API] ✗ ERROR:', error.message);
      console.error('[FEEDBACK API] Stack:', error.stack);
      console.error('[FEEDBACK API] Code:', error.code);
      console.log('[FEEDBACK API] Duration:', Date.now() - startTime, 'ms');

      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        error: error.message,
        code: error.code
      });
    }
  }

  /**
   * Get all feedback - Simple implementation
   * GET /api/feedback
   */
  static async getAllPublic(req, res) {
    console.log('[FEEDBACK API] GET /api/feedback - Fetching all feedback');
    try {
      const query = `
        SELECT 
          f.id, f.user_id, f.route_id, f.vehicle_id, 
          f.feedback_type, f.comment, f.status, 
          f.created_at, f.updated_at
        FROM feedback f
        ORDER BY f.created_at DESC
        LIMIT 200;
      `;

      const result = await pool.query(query);
      console.log('[FEEDBACK API] ✓ Fetched', result.rows.length, 'feedback items');

      res.json({
        success: true,
        message: 'Feedback fetched successfully',
        count: result.rows.length,
        feedback: result.rows
      });
    } catch (error) {
      console.error('[FEEDBACK API] Error fetching feedback:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: error.message
      });
    }
  }

  /**
   * Get feedback by ID
   * GET /api/feedback/:feedbackId
   */
  static async getFeedbackById(req, res) {
    const { feedbackId } = req.params;
    console.log('[FEEDBACK API] GET /api/feedback/:id -', feedbackId);

    try {
      const query = 'SELECT * FROM feedback WHERE id = $1;';
      const result = await pool.query(query, [feedbackId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        feedback: result.rows[0]
      });
    } catch (error) {
      console.error('[FEEDBACK API] Error fetching feedback:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: error.message
      });
    }
  }

  /**
   * Delete feedback
   * DELETE /api/feedback/:feedbackId
   */
  static async deleteFeedback(req, res) {
    const { feedbackId } = req.params;
    console.log('[FEEDBACK API] DELETE /api/feedback/:id -', feedbackId);

    try {
      const query = 'DELETE FROM feedback WHERE id = $1 RETURNING id;';
      const result = await pool.query(query, [feedbackId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        message: 'Feedback deleted successfully',
        id: result.rows[0].id
      });
    } catch (error) {
      console.error('[FEEDBACK API] Error deleting feedback:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete feedback',
        error: error.message
      });
    }
  }
}

module.exports = FeedbackController;
