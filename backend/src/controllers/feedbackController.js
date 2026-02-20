const FeedbackModel = require('../models/feedbackModel');
const SmsService = require('../services/smsService');
const WhatsappService = require('../services/whatsappService');
const NTSAService = require('../services/ntsaService');
const UserModel = require('../models/userModel');

class FeedbackController {
  /**
   * Submit feedback - Simple, direct implementation
   * POST /api/feedback
   */
  static async submitFeedback(req, res) {
    try {
      const userId = req.userId || null;
      const { 
        routeId, 
        vehicleId, 
        feedbackType, 
        comment, 
        phoneNumber,
        reportType, // 'FEEDBACK' | 'INCIDENT' | 'REPORT_TO_NTSA'
        ntsaPriority,
        ntsaCategory,
        saccoName,
        incidentDate,
        incidentTime,
        crewDetails,
        vehicleNumber,
        routeName,
        evidence
      } = req.body;

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

      // Classify complaint and check if it should go to NTSA
      let ntsaClassification = null;
      if (feedbackType === 'Complaint') {
        const useOverride = reportType === 'REPORT_TO_NTSA' && ntsaPriority && ntsaCategory;
        ntsaClassification = NTSAService.classifyComplaint({
          complaintType: reportType,
          comment,
          vehicleNumber: vehicleNumber || `Vehicle ${vehicleId}`,
          routeName: routeName || `Route ${routeId}`,
          ntsaPriority: useOverride ? ntsaPriority : undefined,
          ntsaCategory: useOverride ? ntsaCategory : undefined,
        });
      }

      // Submit feedback to database with NTSA metadata when available
      const feedback = await FeedbackModel.submitFeedback(
        userId,
        routeId,
        vehicleId,
        feedbackType,
        comment,
        reportType,
        ntsaClassification?.priority || null,
        ntsaClassification?.category || null,
        saccoName || null,
        incidentDate || null,
        incidentTime || null,
        crewDetails || null,
        evidence || null,
        vehicleNumber || null
      );

      // Handle NTSA reporting if it's a critical complaint
      let ntsaResult = null;
      if (ntsaClassification && ntsaClassification.shouldForwardToNTSA) {
        ntsaResult = await NTSAService.forwardToNTSA(
          {
            complaintType: reportType,
            comment,
            vehicleNumber: vehicleNumber || `Vehicle ${vehicleId}`,
            routeName: routeName || `Route ${routeId}`,
            saccoName: saccoName || null,
            crewDetails,
            incidentDate,
            incidentTime,
            evidence,
            passengerContact: phoneNumber,
            ntsaCategory: ntsaClassification.category,
          },
          ntsaClassification
        );
        console.log('NTSA Forwarding Result:', ntsaResult);
        if (ntsaResult?.success) {
          await FeedbackModel.updateNTSAForwarded(feedback.id, true);
        }
      }

      // Send SMS notification if phone number provided (FR4)
      let smsSent = false;
      let whatsappSent = false;
      if (phoneNumber) {
        try {
          const smsMessage = ntsaClassification
            ? `Thank you for your ${feedbackType.toLowerCase()} (${ntsaClassification.priority}). Your complaint ID: ${feedback.id}. Priority escalation in progress.`
            : `Thank you for your ${feedbackType.toLowerCase()} on route. Your feedback ID: ${feedback.id}`;
          
          await SmsService.sendSms(phoneNumber, smsMessage);
          smsSent = true;
        } catch (smsError) {
          console.error('SMS notification failed:', smsError);
        }

        // Send WhatsApp notification
        try {
          const whatsappResult = await WhatsappService.sendFeedbackConfirmation(phoneNumber, {
            feedbackType: feedbackType,
            routeName: routeName || `Route ${routeId}`,
            vehicleReg: vehicleNumber || `Vehicle ${vehicleId}`,
            feedbackId: feedback.id,
            priority: ntsaClassification?.priority,
            category: ntsaClassification?.category,
          });
          whatsappSent = whatsappResult.success !== false;
          if (whatsappSent) {
            console.log('✓ WhatsApp feedback confirmation sent');
          } else {
            console.warn('⚠️ WhatsApp feedback confirmation failed:', whatsappResult.error);
            
            // If user not in sandbox (error 63007), send SMS with join instructions
            if (whatsappResult.needsJoin || whatsappResult.code === 63007) {
              try {
                const joinInstructions = `MatatuConnect: Feedback received! Get WhatsApp alerts - Send "join break-additional" to +14155238886. Join now!`;
                await SmsService.sendSms(phoneNumber, joinInstructions);
                console.log('✓ SMS join instructions sent as fallback');
              } catch (smsFallbackError) {
                console.error('SMS join instructions failed:', smsFallbackError.message);
              }
            }
          }
        } catch (whatsappError) {
          console.error('WhatsApp notification failed:', whatsappError.message);
        }
      }

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
          sms: smsSent,
          whatsapp: whatsappSent
        },
        ntsaClassification,
        ntsaForwarding: ntsaResult
      });

    } catch (error) {
      console.error('[FEEDBACK API] ✗ ERROR:', error.message);
      console.error('[FEEDBACK API] Stack:', error.stack);
      console.error('[FEEDBACK API] Code:', error.code);
      console.log('[FEEDBACK API] Duration:', Date.now() - startTime, 'ms');

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

  // Upload evidence files for NTSA reports
  static async uploadEvidence(req, res) {
    try {
      const files = (req.files || []).map((file) => {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `${baseUrl}/uploads/feedback-evidence/${file.filename}`,
        };
      });

      res.json({
        message: 'Evidence uploaded successfully',
        files,
      });
    } catch (error) {
      console.error('Upload evidence error:', error);
      res.status(500).json({ message: 'Failed to upload evidence', error: error.message });
    }
  }

  // Public: list feedback (for dashboard)
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

  // Admin: Get NTSA classification statistics
  static async getNTSAStats(req, res) {
    try {
      const feedback = await FeedbackModel.getAllFeedback(1000, 0, {});
      const complaints = feedback.filter(f => f.feedback_type === 'Complaint');

      const summary = NTSAService.getClassificationSummary(
        complaints.map(c => ({
          complaintType: c.report_type,
          comment: c.comment,
          vehicleNumber: c.vehicle_registration,
          routeName: c.route_name,
          ntsaPriority: c.ntsa_priority,
          ntsaCategory: c.ntsa_category,
        }))
      );

      res.json({
        message: 'NTSA statistics fetched',
        stats: summary,
        criticalComplaints: feedback.filter(f => {
          const classification = NTSAService.classifyComplaint({
            comment: f.comment,
            complaintType: f.report_type,
            ntsaPriority: f.ntsa_priority,
            ntsaCategory: f.ntsa_category,
          });
          return classification.priority === 'CRITICAL';
        }),
      });
    } catch (error) {
      console.error('Get NTSA stats error:', error);
      res.status(500).json({ message: 'Failed to fetch NTSA stats', error: error.message });
    }
  }

  // Admin: Forward specific feedback to NTSA
  static async forwardToNTSA(req, res) {
    try {
      const { feedbackId } = req.params;
      const { reason, additionalInfo } = req.body;

      const feedback = await FeedbackModel.getFeedbackById(feedbackId);

      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      const classification = NTSAService.classifyComplaint({
        comment: feedback.comment,
        complaintType: feedback.report_type,
        vehicleNumber: feedback.vehicle_registration,
        routeName: feedback.route_name,
        ntsaPriority: feedback.ntsa_priority,
        ntsaCategory: feedback.ntsa_category,
      });

      const result = await NTSAService.forwardToNTSA(
        {
          complaintType: feedback.report_type,
          comment: feedback.comment + (additionalInfo ? '\n\nAdmin Notes: ' + additionalInfo : ''),
          vehicleNumber: feedback.vehicle_registration,
          routeName: feedback.route_name,
          saccoName: feedback.sacco_name,
          crewDetails: feedback.crew_details,
          incidentDate: feedback.incident_date,
          incidentTime: feedback.incident_time,
          evidence: feedback.evidence,
          reason,
        },
        classification
      );

      if (result.success) {
        await FeedbackModel.updateNTSAForwarded(feedbackId, true);
        console.log('✓ Feedback forwarded to NTSA:', {
          feedbackId,
          messageId: result.messageId,
        });
      }

      res.json({
        message: 'Forward to NTSA processed',
        classification,
        result,
      });
    } catch (error) {
      console.error('Forward to NTSA error:', error);
      res.status(500).json({ message: 'Failed to forward to NTSA', error: error.message });
    }
  }

  // Admin: Send WhatsApp feedback summary to customers
  static async sendFeedbackWhatsApp(req, res) {
    try {
      const { feedbackId, phoneNumber } = req.params;

      const feedback = await FeedbackModel.getFeedbackById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      await FeedbackModel.deleteFeedback(feedbackId);

      res.json({
        success: true,
        message: 'Feedback deleted successfully',
        id: result.rows[0].id
      });
    } catch (error) {
      console.error('Send feedback WhatsApp error:', error);
      res.status(500).json({ message: 'Failed to send WhatsApp', error: error.message });
    }
  }

  // Admin: Get NTSA classification statistics
  static async getNTSAStats(req, res) {
    try {
      const feedback = await FeedbackModel.getAllFeedback(1000, 0, {});
      const complaints = feedback.filter(f => f.feedback_type === 'Complaint');

      const summary = NTSAService.getClassificationSummary(
        complaints.map(c => ({
          complaintType: c.report_type,
          comment: c.comment,
          vehicleNumber: c.vehicle_registration,
          routeName: c.route_name,
          ntsaPriority: c.ntsa_priority,
          ntsaCategory: c.ntsa_category,
        }))
      );

      res.json({
        message: 'NTSA statistics fetched',
        stats: summary,
        criticalComplaints: feedback.filter(f => {
          const classification = NTSAService.classifyComplaint({
            comment: f.comment,
            complaintType: f.report_type,
            ntsaPriority: f.ntsa_priority,
            ntsaCategory: f.ntsa_category,
          });
          return classification.priority === 'CRITICAL';
        }),
      });
    } catch (error) {
      console.error('Get NTSA stats error:', error);
      res.status(500).json({ message: 'Failed to fetch NTSA stats', error: error.message });
    }
  }

  // Admin: Forward specific feedback to NTSA
  static async forwardToNTSA(req, res) {
    try {
      const { feedbackId } = req.params;
      const { reason, additionalInfo } = req.body;

      const feedback = await FeedbackModel.getFeedbackById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      const classification = NTSAService.classifyComplaint({
        comment: feedback.comment,
        complaintType: feedback.report_type,
        vehicleNumber: feedback.vehicle_registration,
        routeName: feedback.route_name,
        ntsaPriority: feedback.ntsa_priority,
        ntsaCategory: feedback.ntsa_category,
      });

      const result = await NTSAService.forwardToNTSA(
        {
          complaintType: feedback.report_type,
          comment: feedback.comment + (additionalInfo ? '\n\nAdmin Notes: ' + additionalInfo : ''),
          vehicleNumber: feedback.vehicle_registration,
          routeName: feedback.route_name,
          saccoName: feedback.sacco_name,
          crewDetails: feedback.crew_details,
          incidentDate: feedback.incident_date,
          incidentTime: feedback.incident_time,
          evidence: feedback.evidence,
          reason,
        },
        classification
      );

      if (result.success) {
        await FeedbackModel.updateNTSAForwarded(feedbackId, true);
        console.log('✓ Feedback forwarded to NTSA:', {
          feedbackId,
          messageId: result.messageId,
        });
      }

      res.json({
        message: 'Forward to NTSA processed',
        classification,
        result,
      });
    } catch (error) {
      console.error('Forward to NTSA error:', error);
      res.status(500).json({ message: 'Failed to forward to NTSA', error: error.message });
    }
  }

  // Admin: Send WhatsApp feedback summary to customers
  static async sendFeedbackWhatsApp(req, res) {
    try {
      const { feedbackId, phoneNumber } = req.params;

      const feedback = await FeedbackModel.getFeedbackById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      const classification = NTSAService.classifyComplaint({
        comment: feedback.comment,
        complaintType: feedback.report_type,
        vehicleNumber: feedback.vehicle_registration,
        routeName: feedback.route_name,
      });

      // Send WhatsApp notification
      const whatsappResult = await WhatsappService.sendFeedbackConfirmation(phoneNumber || feedback.phone_number, {
        feedbackType: feedback.feedback_type,
        routeName: feedback.route_name,
        vehicleReg: feedback.vehicle_registration,
        feedbackId: feedback.id,
        priority: classification.priority,
        category: classification.category,
      });

      // If NTSA-forwarded, send additional notification
      if (classification.shouldForwardToNTSA) {
        try {
          await WhatsappService.sendNTSAForwardNotification(phoneNumber || feedback.phone_number, {
            feedbackId: feedback.id,
            category: classification.category,
            priority: classification.priority,
            vehicleReg: feedback.vehicle_registration,
            routeName: feedback.route_name,
          });
        } catch (ntsaError) {
          console.warn('Failed to send NTSA notification:', ntsaError.message);
        }
      }

      res.json({
        message: 'WhatsApp notifications sent',
        whatsappResult,
      });
    } catch (error) {
      console.error('Send feedback WhatsApp error:', error);
      res.status(500).json({ message: 'Failed to send WhatsApp', error: error.message });
    }
  }
}

module.exports = FeedbackController;
