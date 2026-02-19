const FeedbackModel = require('../models/feedbackModel');
const SmsService = require('../services/smsService');
const WhatsappService = require('../services/whatsappService');
const NTSAService = require('../services/ntsaService');
const UserModel = require('../models/userModel');

class FeedbackController {
  // Submit feedback (FR1: route, vehicle, feedback type, comment)
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
      if (!routeId || !vehicleId || !feedbackType || !comment) {
        return res.status(400).json({ 
          message: 'Missing required fields: routeId, vehicleId, feedbackType, comment' 
        });
      }

      // Validate feedback type
      if (!['Complaint', 'Compliment'].includes(feedbackType)) {
        return res.status(400).json({ 
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
        message: 'Feedback submitted successfully',
        feedback,
        notificationsSent: {
          sms: smsSent,
          whatsapp: whatsappSent
        },
        ntsaClassification,
        ntsaForwarding: ntsaResult
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
