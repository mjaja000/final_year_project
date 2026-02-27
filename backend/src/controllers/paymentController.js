const PaymentModel = require('../models/paymentModel');
const SmsService = require('../services/smsService');
const WhatsappService = require('../services/whatsappService');
const UserModel = require('../models/userModel');
const MpesaService = require('../services/mpesaService');
const VehicleModel = require('../models/vehicleModel');
const OccupancyModel = require('../models/occupancyModel');
const pool = require('../config/database');

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

const getSafeTicketReference = (payment) => {
  if (payment?.transaction_id) return payment.transaction_id;
  if (payment?.checkout_request_id) return payment.checkout_request_id;
  return `TKT-${payment?.id || Date.now()}`;
};

const isTruthyRefresh = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const STK_QUERY_MIN_INTERVAL_MS = 5000;
const STK_RATE_LIMIT_COOLDOWN_MS = 65000;
const stkQueryLastRunByCheckout = new Map();

class PaymentController {
  // Auto-increment vehicle occupancy when a payment completes.
  // Assigns vehicle_id to the payment if not set, then increments occupancy of the active vehicle.
  static async autoIncrementOccupancy(payment, io = null) {
    if (!payment) return;
    try {
      let vehicleId = payment.vehicle_id ? Number(payment.vehicle_id) : null;

      // Find the active (currently-filling) vehicle for this route if not already linked
      if (!vehicleId && payment.route_id) {
        const activeVehicle = await VehicleModel.getActiveVehicleForRoute(Number(payment.route_id));
        vehicleId = activeVehicle?.id || null;
        if (vehicleId) {
          // Persist the vehicle assignment on the payment row
          await pool.query('UPDATE payments SET vehicle_id = $1 WHERE id = $2', [vehicleId, payment.id]);
        }
      }

      if (!vehicleId) return;

      const vehicle = await VehicleModel.getVehicleById(vehicleId);
      if (!vehicle) return;

      const capacity = Number(vehicle.capacity || 14);
      const occupancyRecord = await OccupancyModel.getOccupancyStatus(vehicleId);
      const currentOccupancy = Number(occupancyRecord?.current_occupancy || 0);

      if (currentOccupancy >= capacity) return; // already full, next payment will go to next vehicle

      const newOccupancy = currentOccupancy + 1;
      const driverId = vehicle.user_id || null;
      const updated = await OccupancyModel.updateOccupancyCount(vehicleId, driverId, newOccupancy, capacity);

      if (io) {
        const payload = {
          vehicle_id: vehicleId,
          current_occupancy: newOccupancy,
          occupancy_status: updated.occupancy_status,
          capacity,
        };
        io.to('admin').emit('vehicle.occupancyUpdated', payload);
        if (driverId) io.to(`user_${driverId}`).emit('vehicle.occupancyUpdated', payload);
      }
      return updated;
    } catch (err) {
      console.error('Auto increment occupancy error:', err.message);
    }
  }

  static async reconcilePendingPayment(payment, io = null) {
    if (!payment || payment.status !== 'pending' || !payment.checkout_request_id) {
      return payment;
    }

    const checkoutId = payment.checkout_request_id;
    const now = Date.now();
    const lastRunAt = stkQueryLastRunByCheckout.get(checkoutId) || 0;
    if (now - lastRunAt < STK_QUERY_MIN_INTERVAL_MS) {
      return payment;
    }

    stkQueryLastRunByCheckout.set(checkoutId, now);

    try {
      const statusResponse = await MpesaService.queryStkPushStatus(payment.checkout_request_id);
      const resultCode = String(statusResponse?.ResultCode ?? '');
      const resultDesc = statusResponse?.ResultDesc || statusResponse?.errorMessage || 'Pending confirmation';

      if (resultCode === '0') {
        const transactionId = statusResponse?.MpesaReceiptNumber || payment.checkout_request_id;
        const updated = await PaymentModel.updateStatusByCheckoutRequestId(
          payment.checkout_request_id,
          'completed',
          transactionId,
          null
        );

        if (updated) {
          const paymentWithDetails = await PaymentModel.getPaymentByIdWithDetails(updated.id);
          const ticketReference = getSafeTicketReference(paymentWithDetails || updated);

          let customerWhatsappStatus = { sent: false, error: null };
          let driverWhatsappStatus = { sent: false, error: null };

          // Send to customer
          try {
            const whatsappResult = await WhatsappService.sendPaymentConfirmation(updated.phone_number, {
              routeName: paymentWithDetails?.route_name || `Route ${updated.route_id}`,
              vehicleNumber: paymentWithDetails?.vehicle_number || 'N/A',
              amount: updated.amount,
              transactionId: ticketReference,
            });
            customerWhatsappStatus.sent = whatsappResult?.success !== false;
            if (!customerWhatsappStatus.sent) {
              customerWhatsappStatus.error = whatsappResult?.error || 'WhatsApp send failed';
            }
          } catch (whatsappError) {
            console.error('WhatsApp send to customer failed:', whatsappError.message);
            customerWhatsappStatus.error = whatsappError.message;
          }

          // Send to driver if vehicle assigned
          if (paymentWithDetails?.vehicle_id) {
            try {
              const DriverModel = require('../models/driverModel');
              const driver = await DriverModel.getDriverByVehicleId(paymentWithDetails.vehicle_id);
              if (driver && driver.phone) {
                const driverWhatsappResult = await WhatsappService.sendPaymentConfirmation(driver.phone, {
                  routeName: paymentWithDetails?.route_name || `Route ${updated.route_id}`,
                  vehicleNumber: paymentWithDetails?.vehicle_number || 'N/A',
                  amount: updated.amount,
                  transactionId: ticketReference,
                  recipientType: 'driver',
                });
                driverWhatsappStatus.sent = driverWhatsappResult?.success !== false;
                if (!driverWhatsappStatus.sent) {
                  driverWhatsappStatus.error = driverWhatsappResult?.error || 'WhatsApp send failed';
                }
              }
            } catch (driverError) {
              console.error('WhatsApp send to driver failed:', driverError.message);
              driverWhatsappStatus.error = driverError.message;
            }
          }

          const result = paymentWithDetails || updated;
          result.whatsapp_status = customerWhatsappStatus;
          result.driver_whatsapp_status = driverWhatsappStatus;
          // Auto-increment vehicle occupancy from this completed payment
          await PaymentController.autoIncrementOccupancy(updated, io);
          return result;
        }
      }

      if (resultCode && resultCode !== '1032' && resultCode !== '1') {
        const updatedFailed = await PaymentModel.updateStatusByCheckoutRequestId(
          payment.checkout_request_id,
          'failed',
          null,
          resultDesc
        );
        return updatedFailed || payment;
      }

      return payment;
    } catch (error) {
      const errorCode = error?.response?.data?.fault?.detail?.errorcode;
      if (errorCode === 'policies.ratelimit.SpikeArrestViolation') {
        stkQueryLastRunByCheckout.set(checkoutId, now + STK_RATE_LIMIT_COOLDOWN_MS);
      }
      console.warn('STK fallback query skipped:', error.response?.data || error.message);
      return payment;
    }
  }

  // Real M-Pesa STK Push initiation (Sandbox)
  static async initiatePayment(req, res) {
    let paymentRecord = null;
    try {
      const { phone, phoneNumber, amount = 50, vehicle, route, routeId } = req.body || {};
      const normalizedPhone = normalizePhoneNumber(phone || phoneNumber);

      if (!normalizedPhone) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }

      const parsedRouteId = Number(route || routeId);
      if (!Number.isFinite(parsedRouteId) || parsedRouteId <= 0) {
        return res.status(400).json({ message: 'A valid route ID is required to initiate payment' });
      }

      const userId = req.userId || null;
      let vehicleId = null;
      if (vehicle) {
        const foundVehicle = await VehicleModel.getVehicleByRegistration(String(vehicle).trim().toUpperCase());
        vehicleId = foundVehicle?.id || null;
      }
      // Auto-assign the active vehicle for this route if none specified
      if (!vehicleId && parsedRouteId) {
        const activeVehicle = await VehicleModel.getActiveVehicleForRoute(parsedRouteId);
        vehicleId = activeVehicle?.id || null;
      }

      paymentRecord = await PaymentModel.initiatePayment(
        userId,
        parsedRouteId,
        parsedAmount,
        normalizedPhone,
        vehicleId
      );

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
        await PaymentModel.updateMpesaRequestIds(
          paymentRecord.id,
          response.MerchantRequestID,
          response.CheckoutRequestID
        );

        return res.status(200).json({
          success: true,
          message: 'Check your phone for M-Pesa prompt!',
          payment_id: paymentRecord.id,
          checkout_request_id: response.CheckoutRequestID,
          merchant_request_id: response.MerchantRequestID,
        });
      }

      await PaymentModel.updatePaymentWithReason(
        paymentRecord.id,
        'failed',
        response.ResponseDescription || 'M-Pesa STK push failed'
      );

      return res.status(502).json({
        success: false,
        message: response.ResponseDescription || 'M-Pesa STK push failed',
        details: response,
      });
    } catch (error) {
      console.error('Initiate payment error:', error.response?.data || error.message);
      if (paymentRecord?.id) {
        try {
          await PaymentModel.updatePaymentWithReason(
            paymentRecord.id,
            'failed',
            error.response?.data?.errorMessage || error.message
          );
        } catch (updateError) {
          console.error('Failed to mark payment as failed:', updateError.message);
        }
      }
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
      const resultDesc =
        callbackBody?.Body?.stkCallback?.ResultDesc ?? callbackBody?.ResultDesc ?? 'Payment was not completed';
      const checkoutRequestId =
        callbackBody?.Body?.stkCallback?.CheckoutRequestID ?? callbackBody?.CheckoutRequestID;

      const metadataItems = callbackBody?.Body?.stkCallback?.CallbackMetadata?.Item || [];
      const metadata = metadataItems.reduce((acc, item) => {
        if (item?.Name) {
          acc[item.Name] = item.Value;
        }
        return acc;
      }, {});

      if (!checkoutRequestId) {
        console.warn('M-Pesa callback missing CheckoutRequestID. Cannot reconcile payment row.');
        return res.status(200).send('Success');
      }

      if (String(resultCode) === '0') {
        const transactionId = metadata.MpesaReceiptNumber || checkoutRequestId;

        const updatedPayment = await PaymentModel.updateStatusByCheckoutRequestId(
          checkoutRequestId,
          'completed',
          transactionId,
          null
        );

        if (!updatedPayment) {
          console.warn(`No payment record found for checkout_request_id: ${checkoutRequestId}`);
          return res.status(200).send('Success');
        }

        const paymentWithDetails = await PaymentModel.getPaymentByIdWithDetails(updatedPayment.id);
        const ticketReference = getSafeTicketReference(paymentWithDetails || updatedPayment);

        let customerWhatsappStatus = { sent: false, error: null };
        let driverWhatsappStatus = { sent: false, error: null };

        // Send to customer
        try {
          const whatsappResult = await WhatsappService.sendPaymentConfirmation(updatedPayment.phone_number, {
            routeName: paymentWithDetails?.route_name || `Route ${updatedPayment.route_id}`,
            vehicleNumber: paymentWithDetails?.vehicle_number || 'N/A',
            amount: updatedPayment.amount,
            transactionId: ticketReference,
          });
          customerWhatsappStatus.sent = whatsappResult?.success !== false;
          if (!customerWhatsappStatus.sent) {
            customerWhatsappStatus.error = whatsappResult?.error || 'WhatsApp send failed';
          }
          console.log('✓ WhatsApp payment confirmation sent to customer from callback');
        } catch (whatsappError) {
          console.error('WhatsApp callback notification to customer failed:', whatsappError.message);
          customerWhatsappStatus.error = whatsappError.message;
        }

        // Send to driver if vehicle assigned
        if (paymentWithDetails?.vehicle_id) {
          try {
            const DriverModel = require('../models/driverModel');
            const driver = await DriverModel.getDriverByVehicleId(paymentWithDetails.vehicle_id);
            if (driver && driver.phone) {
              const driverWhatsappResult = await WhatsappService.sendPaymentConfirmation(driver.phone, {
                routeName: paymentWithDetails?.route_name || `Route ${updatedPayment.route_id}`,
                vehicleNumber: paymentWithDetails?.vehicle_number || 'N/A',
                amount: updatedPayment.amount,
                transactionId: ticketReference,
                recipientType: 'driver',
              });
              driverWhatsappStatus.sent = driverWhatsappResult?.success !== false;
              if (!driverWhatsappStatus.sent) {
                driverWhatsappStatus.error = driverWhatsappResult?.error || 'WhatsApp send failed';
              }
              console.log('✓ WhatsApp payment confirmation sent to driver from callback');
            }
          } catch (driverError) {
            console.error('WhatsApp callback notification to driver failed:', driverError.message);
            driverWhatsappStatus.error = driverError.message;
          }
        }

        console.log(`✓ Payment verified and completed for payment_id=${updatedPayment.id}`);
        // Auto-increment vehicle occupancy from this completed payment
        const io = req.app.get('io') || null;
        await PaymentController.autoIncrementOccupancy(updatedPayment, io);
      } else {
        await PaymentModel.updateStatusByCheckoutRequestId(
          checkoutRequestId,
          'failed',
          null,
          resultDesc
        );
        console.log('M-Pesa payment failed:', resultDesc);
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
      const shouldRefresh = isTruthyRefresh(req.query.refresh);

      let payment = await PaymentModel.getPaymentByIdWithDetails(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      if (shouldRefresh && payment.status === 'pending') {
        const io = req.app.get('io') || null;
        payment = await PaymentController.reconcilePendingPayment(payment, io);
        payment = await PaymentModel.getPaymentByIdWithDetails(paymentId) || payment;
      }

      const ticketReference = getSafeTicketReference(payment);

      res.json({
        message: 'Payment status fetched',
        payment,
        whatsapp_status: payment.whatsapp_status || null,
        driver_whatsapp_status: payment.driver_whatsapp_status || null,
        ticket: payment.status === 'completed'
          ? {
              reference: ticketReference,
              routeName: payment.route_name,
              amount: payment.amount,
              paidAt: payment.updated_at,
            }
          : null,
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
