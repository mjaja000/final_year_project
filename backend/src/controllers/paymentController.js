const PaymentModel = require('../models/paymentModel');
const SmsService = require('../services/smsService');
const WhatsappService = require('../services/whatsappService');
const UserModel = require('../models/userModel');
const MpesaService = require('../services/mpesaService');

const normalizePhoneNumber = (rawPhone) => {
  if (!rawPhone) return null;

  const digitsOnly = String(rawPhone).trim().replace(/[^0-9]/g, '');

  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `254${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.startsWith('7') && digitsOnly.length === 9) {
    return `254${digitsOnly}`;
  }

  if (digitsOnly.startsWith('254') && digitsOnly.length === 12) {
    return digitsOnly;
  }

  return null;
};

class PaymentController {
  // Real M-Pesa STK Push initiation (Sandbox)
  static async initiatePayment(req, res) {
    try {
      const { phone, amount = 50, vehicle, route } = req.body || {};
      const normalizedPhone = normalizePhoneNumber(phone);

      if (!normalizedPhone) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }

      const businessCode = process.env.MPESA_BUSINESS_CODE || process.env.MPESA_SHORTCODE;
      if (!process.env.MPESA_CALLBACK_URL || !process.env.MPESA_API_URL || !businessCode) {
        return res.status(500).json({
          message: 'M-Pesa configuration is incomplete. Check MPESA_API_URL, MPESA_BUSINESS_CODE/MPESA_SHORTCODE, and MPESA_CALLBACK_URL.',
        });
      }

      if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET || !process.env.MPESA_PASSKEY) {
        return res.status(500).json({
          message: 'M-Pesa credentials are missing. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_PASSKEY.',
        });
      }

      const accountReference = `Matatu-${vehicle || 'demo'}`;
      const transactionDesc = `MatatuConnect ${route || 'route'} KES ${parsedAmount} simulation`;

      // Initiate STK push to the customer's phone
      const response = await MpesaService.initiateStkPush({
        amount: parsedAmount,
        phoneNumber: normalizedPhone,
        accountReference,
        transactionDesc,
        callbackUrl: process.env.MPESA_CALLBACK_URL,
      });

      if (response.ResponseCode === '0') {
        return res.status(200).json({
          success: true,
          message: 'Check your phone for M-Pesa prompt!',
          checkout_request_id: response.CheckoutRequestID,
          merchant_request_id: response.MerchantRequestID,
        });
      }

      return res.status(502).json({
        success: false,
        message: response.ResponseDescription || 'M-Pesa STK push failed',
        details: response,
      });
    } catch (error) {
      console.error('Initiate payment error:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate M-Pesa STK push',
        error: error.response?.data || error.message,
      });
    }
  }

  // M-Pesa STK push callback (called by Safaricom)
  static async mpesaCallback(req, res) {
    try {
      const callbackBody = req.body || {};
      console.log('M-Pesa callback received:', JSON.stringify(callbackBody, null, 2));

      const resultCode =
        callbackBody?.Body?.stkCallback?.ResultCode ?? callbackBody?.ResultCode;

      const metadataItems = callbackBody?.Body?.stkCallback?.CallbackMetadata?.Item || [];
      const metadata = metadataItems.reduce((acc, item) => {
        if (item?.Name) {
          acc[item.Name] = item.Value;
        }
        return acc;
      }, {});

      if (String(resultCode) === '0') {
        console.log('Simulated payment success');

        const phoneNumber = metadata.PhoneNumber;
        const amount = metadata.Amount;
        const transactionId = metadata.MpesaReceiptNumber || metadata.CheckoutRequestID;

        if (phoneNumber && amount) {
          try {
            await WhatsappService.sendPaymentConfirmation(phoneNumber, {
              routeName: 'N/A',
              amount: amount,
              transactionId: transactionId || 'M-Pesa'
            });
            console.log('✓ WhatsApp payment confirmation sent from callback');
          } catch (whatsappError) {
            console.error('WhatsApp callback notification failed:', whatsappError.message);
          }
        }
      } else {
        console.log('Simulated payment failed:', callbackBody?.Body?.stkCallback?.ResultDesc);
      }

      res.status(200).send('Success');
    } catch (error) {
      console.error('M-Pesa callback error:', error.message);
      res.status(200).send('Success');
    }
  }

  // Simulate M-Pesa payment (FR2)
  static async simulatePayment(req, res) {
    try {
      const userId = req.userId || null;
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
      let smsSent = false;
      let whatsappSent = false;
      try {
        await SmsService.sendSms(
          phoneNumber,
          `M-Pesa Payment Simulated: KES ${amount} for route. Transaction ID: ${simulatedTransactionId}`
        );
        smsSent = true;
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }

      // Send WhatsApp notification
      try {
        const whatsappResult = await WhatsappService.sendPaymentConfirmation(phoneNumber, {
          routeName: `Route ${routeId}`,
          amount: amount,
          transactionId: simulatedTransactionId
        });
        whatsappSent = whatsappResult.success !== false;
        if (whatsappSent) {
          console.log('✓ WhatsApp payment confirmation sent');
        } else {
          console.warn('⚠️ WhatsApp payment confirmation failed:', whatsappResult.error);
          
          // If user not in sandbox (error 63007), send SMS with join instructions
          if (whatsappResult.needsJoin || whatsappResult.code === 63007) {
            try {
              const joinInstructions = `MatatuConnect: Payment received KES ${amount}! Get WhatsApp alerts - Send "join break-additional" to +14155238886. Takes 5 sec!`;
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

      res.status(201).json({
        message: 'M-Pesa STK simulation initiated',
        payment: {
          ...payment,
          simulationNote: 'This is a simulated payment. No real funds will be transferred.'
        },
        simulatedStatus: 'STK Prompt Sent (Simulated)',
        notificationsSent: {
          sms: smsSent,
          whatsapp: whatsappSent
        }
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

  // Public: get all payments (for dashboards)
  static async getAllPaymentsPublic(req, res) {
    try {
      const payments = await PaymentModel.getAllPayments(100, 0, {});
      res.json({
        message: 'Payments fetched',
        total: payments.length,
        payments,
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
    }
  }
}

module.exports = PaymentController;
