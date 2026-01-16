const PaymentModel = require('../models/paymentModel');
const SmsService = require('../services/smsService');
const WhatsappService = require('../services/whatsappService');

class PaymentController {
  // Simulate M-Pesa payment (FR2)
  static async simulatePayment(req, res) {
    try {
      const userId = req.userId;
      const { routeId, amount, phoneNumber } = req.body;

      // Validate required fields
      if (!routeId || !amount || !phoneNumber) {
        return res.status(400).json({ 
          message: 'Missing required fields: routeId, amount, phoneNumber' 
        });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }

      // Create payment record
      const payment = await PaymentModel.initiatePayment(userId, routeId, amount, phoneNumber);

      // Simulate M-Pesa STK Push (no real funds)
      // In real scenario, this would trigger an actual M-Pesa STK prompt
      const simulatedTransactionId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Simulate successful payment after 2 seconds
      setTimeout(async () => {
        await PaymentModel.updatePaymentStatus(payment.id, 'completed', simulatedTransactionId);
      }, 2000);

      // Send SMS notification (FR4)
      try {
        await SmsService.sendSms(
          phoneNumber,
          `M-Pesa Payment Simulated: KES ${amount} for route. Transaction ID: ${simulatedTransactionId}`
        );
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }

      res.status(201).json({
        message: 'M-Pesa STK simulation initiated',
        payment: {
          ...payment,
          simulationNote: 'This is a simulated payment. No real funds will be transferred.'
        },
        simulatedStatus: 'STK Prompt Sent (Simulated)',
        notificationSent: true
      });
    } catch (error) {
      console.error('Simulate payment error:', error);
      res.status(500).json({ message: 'Payment simulation failed', error: error.message });
    }
  }

  // Get payment status
  static async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await PaymentModel.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.json({
        message: 'Payment status fetched',
        payment,
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ message: 'Failed to fetch payment status', error: error.message });
    }
  }

  // Get user payments
  static async getUserPayments(req, res) {
    try {
      const userId = req.userId;

      const payments = await PaymentModel.getUserPayments(userId);

      res.json({
        message: 'User payments fetched',
        total: payments.length,
        payments,
      });
    } catch (error) {
      console.error('Get user payments error:', error);
      res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
    }
  }

  // Get payment statistics (admin only)
  static async getPaymentStats(req, res) {
    try {
      const filters = {
        routeId: req.query.routeId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const stats = await PaymentModel.getPaymentStats(filters);

      res.json({
        message: 'Payment statistics fetched',
        stats,
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({ message: 'Failed to fetch payment statistics', error: error.message });
    }
  }
}

module.exports = PaymentController;
