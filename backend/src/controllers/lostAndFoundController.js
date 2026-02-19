const LostAndFoundModel = require('../models/lostAndFoundModel');
const WhatsappService = require('../services/whatsappService');

class LostAndFoundController {
  // Create a new lost and found report
  static async createReport(req, res) {
    try {
      const { itemDescription, phoneNumber, vehiclePlate } = req.body;

      // Validation
      if (!itemDescription || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Item description and phone number are required'
        });
      }

      // Phone number validation (basic)
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      const userId = req.user ? req.user.id : null; // Optional user authentication

      const report = await LostAndFoundModel.create({
        userId,
        itemDescription,
        phoneNumber,
        vehiclePlate: vehiclePlate || null
      });

      // Send WhatsApp confirmation to customer
      try {
        await WhatsappService.sendLostAndFoundConfirmation(phoneNumber, {
          reportId: report.id,
          itemDescription: report.item_description,
          vehiclePlate: report.vehicle_plate,
        });
        console.log('✓ Lost and found confirmation WhatsApp sent to', phoneNumber);
      } catch (whatsappError) {
        console.error('⚠️ Failed to send Lost and Found WhatsApp confirmation:', whatsappError.message);
        // Don't fail the API response - report is already created
      }

      res.status(201).json({
        success: true,
        message: 'Lost item report submitted successfully',
        data: report
      });
    } catch (error) {
      console.error('Error creating lost and found report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit report',
        error: error.message
      });
    }
  }

  // Get all reports (Admin)
  static async getAllReports(req, res) {
    try {
      const { status, searchTerm, limit } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (searchTerm) filters.searchTerm = searchTerm;
      if (limit) filters.limit = parseInt(limit);

      const reports = await LostAndFoundModel.getAll(filters);

      res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
      });
    } catch (error) {
      console.error('Error fetching lost and found reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports',
        error: error.message
      });
    }
  }

  // Get report by ID
  static async getReportById(req, res) {
    try {
      const { id } = req.params;

      const report = await LostAndFoundModel.getById(id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report',
        error: error.message
      });
    }
  }

  // Update report status (Admin)
  static async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      // Validate status
      const validStatuses = ['pending', 'found', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const updatedReport = await LostAndFoundModel.updateStatus(id, status, adminNotes);

      if (!updatedReport) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Report status updated successfully',
        data: updatedReport
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update report status',
        error: error.message
      });
    }
  }

  // Delete report (Admin)
  static async deleteReport(req, res) {
    try {
      const { id } = req.params;

      const deletedReport = await LostAndFoundModel.delete(id);

      if (!deletedReport) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
        data: deletedReport
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report',
        error: error.message
      });
    }
  }

  // Get statistics (Admin)
  static async getStats(req, res) {
    try {
      const stats = await LostAndFoundModel.getStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  // Get user's own reports
  static async getMyReports(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const filters = { userId: req.user.id };
      const reports = await LostAndFoundModel.getAll(filters);

      res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
      });
    } catch (error) {
      console.error('Error fetching user reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your reports',
        error: error.message
      });
    }
  }
}

module.exports = LostAndFoundController;
