const PaymentModel = require('../models/paymentModel');
const SmsService = require('../services/smsService');
const WhatsappService = require('../services/whatsappService');
const MpesaService = require('../services/mpesaService');
const VehicleModel = require('../models/vehicleModel');
const DriverModel = require('../models/driverModel');
const OccupancyModel = require('../models/occupancyModel');
const pool = require('../config/database');

// Normalize Kenyan phone formats to 2547XXXXXXXX before sending via M-Pesa/Twilio.
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

const STK_QUERY_MIN_INTERVAL_MS = 2000;
const STK_RATE_LIMIT_COOLDOWN_MS = 8000;
const STK_TERMINAL_FAILURE_CODES = new Set(['1', '17', '26', '1032', '1037', '2001']);
const STK_FAILURE_GRACE_MS = 15000;
const STK_TIMEOUT_FAILURE_GRACE_MS = 60000;
const STK_TIMEOUT_FAILURE_THRESHOLD = 2;
const ASSUMED_SUCCESS_DELAY_MS = 10000;
const ENABLE_AUTO_PAYMENT_WHATSAPP = String(process.env.ENABLE_AUTO_PAYMENT_WHATSAPP || 'false').toLowerCase() === 'true';
const stkQueryLastRunByCheckout = new Map();
const stkTimeoutCountByCheckout = new Map();

// Structured debug logger for payment lifecycle and STK reconciliation traces.
const paymentDebugLog = (event, meta = {}) => {
  console.log(`[PAYMENT_DEBUG] ${new Date().toISOString()} ${event}`, meta);
};

const emitPaymentStatusUpdate = (io, payment, extras = {}) => {
  if (!io || !payment?.id) return;

  const payload = {
    payment_id: payment.id,
    status: payment.status,
    vehicle_id: payment.vehicle_id || null,
    vehicle_number: payment.vehicle_number || null,
    transaction_id: payment.transaction_id || null,
    failure_reason: payment.failure_reason || null,
    updated_at: payment.updated_at || new Date().toISOString(),
    ...extras,
  };

  io.to(`payment_${payment.id}`).emit('payment.statusUpdated', payload);
  io.to('admin').emit('payment.statusUpdated', payload);
};

class PaymentController {
  static async getVehiclePaymentAvailability(vehicleId) {
    const vehicle = await VehicleModel.getVehicleById(vehicleId);
    if (!vehicle) {
      return { available: false, reason: 'Vehicle not found' };
    }

    const capacity = Number(vehicle.capacity || 14);
    const occupancy = await OccupancyModel.getOccupancyStatus(vehicleId);
    const currentOccupancy = Number(occupancy?.current_occupancy || 0);
    const isFullByCount = currentOccupancy >= capacity;
    const isFullByStatus = String(occupancy?.occupancy_status || '').toLowerCase() === 'full';

    return {
      available: !(isFullByCount || isFullByStatus),
      reason: isFullByCount || isFullByStatus ? 'Vehicle is full' : null,
      vehicle,
      currentOccupancy,
      capacity,
    };
  }

  static async sendTicketToWhatsApp(req, res) {
    try {
      const paymentId = Number(req.params.paymentId);
      
      if (!Number.isFinite(paymentId) || paymentId <= 0) {
        return res.status(400).json({ message: 'A valid payment ID is required', paymentId });
      }

      const payment = await PaymentModel.getPaymentByIdWithDetails(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found', paymentId });
      }
      
      if (String(payment.status).toLowerCase() !== 'completed') {
        return res.status(400).json({ message: 'Ticket can only be sent after payment is completed', status: payment.status });
      }

      const normalizedPhone = normalizePhoneNumber(payment.phone_number);
      if (!normalizedPhone) {
        return res.status(400).json({ message: 'Payment does not have a valid phone number for WhatsApp', phone: payment.phone_number });
      }

      const ticketReference = getSafeTicketReference(payment);
      const whatsappResult = await WhatsappService.sendPaymentConfirmation(normalizedPhone, {
        routeName: payment.route_name || `Route ${payment.route_id}`,
        vehicleNumber: payment.vehicle_number || 'N/A',
        amount: payment.amount,
        transactionId: ticketReference,
      });

      if (whatsappResult?.success === false) {
        // If user is not in sandbox, automatically send SMS with join instructions
        if (whatsappResult?.code === 63007 || whatsappResult?.needsJoin) {
          try {
            const joinMessage = `🎯 MatatuConnect - WhatsApp Setup Required

To get your ticket via WhatsApp:

1️⃣ Open WhatsApp
2️⃣ Message: +1 415 523 8886
3️⃣ Send: join break-additional
4️⃣ Confirm sandbox invitation
5️⃣ Your ticket will appear here!

⏱️ Setup takes 30 seconds
✨ After setup, you'll get WhatsApp tickets instantly!`;

            await SmsService.sendSms(payment.phone_number, joinMessage);
            return res.status(202).json({
              message: 'WhatsApp not available yet. Instructions sent via SMS!',
              needsSetup: true,
              setupMethod: 'sms_sent',
              details: 'Check your SMS for WhatsApp setup instructions. You\'ll need to join the WhatsApp sandbox first.',
              whatsapp: whatsappResult,
            });
          } catch (smsError) {
            console.error('Failed to send SMS instructions:', smsError.message);
            return res.status(502).json({
              message: 'WhatsApp not available and could not send SMS instructions',
              whatsapp: whatsappResult,
            });
          }
        }
        
        return res.status(502).json({
          message: 'WhatsApp send failed',
          whatsapp: whatsappResult,
        });
      }

      return res.status(200).json({
        message: 'Ticket sent to WhatsApp',
        ticket_reference: ticketReference,
        whatsapp: whatsappResult || { success: true },
      });
    } catch (error) {
      console.error('Send ticket to WhatsApp error:', error);
      return res.status(500).json({ message: 'Failed to send ticket via WhatsApp', error: error.message });
    }
  }

  static async finalizeAssumedSuccessPayment(paymentId, io = null) {
    const assumedTransactionId = `ASSUMED-${paymentId}-${Date.now()}`;
    const completedPayment = await PaymentModel.updatePaymentStatus(
      paymentId,
      'completed',
      assumedTransactionId
    );

    if (!completedPayment) return null;

    const paymentWithDetails = await PaymentModel.getPaymentByIdWithDetails(completedPayment.id);
    const normalizedCompleted = paymentWithDetails || completedPayment;
    const ticketReference = getSafeTicketReference(normalizedCompleted);

    emitPaymentStatusUpdate(io, normalizedCompleted, {
      ticket_reference: ticketReference,
      route_name: normalizedCompleted.route_name || null,
      amount: normalizedCompleted.amount,
    });

    if (ENABLE_AUTO_PAYMENT_WHATSAPP) {
      PaymentController.queuePaymentWhatsAppNotifications(normalizedCompleted, ticketReference);
    }
    await PaymentController.autoIncrementOccupancy(normalizedCompleted, io);
    return normalizedCompleted;
  }

  static async sendPaymentWhatsAppNotifications(paymentRecord, ticketReference) {
    if (!paymentRecord) return;

    try {
      if (paymentRecord.phone_number) {
        const whatsappResult = await WhatsappService.sendPaymentConfirmation(paymentRecord.phone_number, {
          routeName: paymentRecord.route_name || `Route ${paymentRecord.route_id}`,
          vehicleNumber: paymentRecord.vehicle_number || 'N/A',
          amount: paymentRecord.amount,
          transactionId: ticketReference,
        });
        
        // If user is not in sandbox, send SMS with join instructions
        if (whatsappResult?.code === 63007 || whatsappResult?.needsJoin) {
          console.log('[SendPaymentWhatsApp] User not in sandbox, sending SMS join instructions');
          try {
            const joinMessage = `🎯 MatatuConnect - WhatsApp Setup Required\n\nTo get your ticket via WhatsApp:\n\n1️⃣ Open WhatsApp\n2️⃣ Message: +1 415 523 8886\n3️⃣ Send: join break-additional\n4️⃣ Confirm sandbox invitation\n5️⃣ Your ticket will appear here!\n\n⏱️ Setup takes 30 seconds\n✨ After setup, you'll get WhatsApp tickets instantly!`;
            await SmsService.sendSms(paymentRecord.phone_number, joinMessage);
            console.log('[SendPaymentWhatsApp] ✓ SMS join instructions sent to customer');
          } catch (smsError) {
            console.error('[SendPaymentWhatsApp] Failed to send SMS join instructions:', smsError.message);
          }
        }
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification to customer failed:', whatsappError.message);
    }

    if (paymentRecord.vehicle_id) {
      try {
        const driver = await DriverModel.getDriverByVehicleId(paymentRecord.vehicle_id);
        if (driver && driver.phone) {
          const driverWhatsappResult = await WhatsappService.sendPaymentConfirmation(driver.phone, {
            routeName: paymentRecord.route_name || `Route ${paymentRecord.route_id}`,
            vehicleNumber: paymentRecord.vehicle_number || 'N/A',
            amount: paymentRecord.amount,
            transactionId: ticketReference,
            recipientType: 'driver',
          });
          
          // If driver is not in sandbox, send SMS with join instructions
          if (driverWhatsappResult?.code === 63007 || driverWhatsappResult?.needsJoin) {
            console.log('[SendPaymentWhatsApp] Driver not in sandbox, sending SMS join instructions');
            try {
              const joinMessage = `🎯 MatatuConnect - WhatsApp Setup Required\n\nTo get payment notifications via WhatsApp:\n\n1️⃣ Open WhatsApp\n2️⃣ Message: +1 415 523 8886\n3️⃣ Send: join break-additional\n4️⃣ Confirm sandbox invitation\n\n⏱️ Setup takes 30 seconds\n✨ After setup, receive instant payment alerts!`;
              await SmsService.sendSms(driver.phone, joinMessage);
              console.log('[SendPaymentWhatsApp] ✓ SMS join instructions sent to driver');
            } catch (smsError) {
              console.error('[SendPaymentWhatsApp] Failed to send SMS join instructions to driver:', smsError.message);
            }
          }
        }
      } catch (driverError) {
        console.error('WhatsApp notification to driver failed:', driverError.message);
      }
    }
  }

  static queuePaymentWhatsAppNotifications(paymentRecord, ticketReference) {
    setImmediate(async () => {
      try {
        await PaymentController.sendPaymentWhatsAppNotifications(paymentRecord, ticketReference);
      } catch (error) {
        console.error('Queued WhatsApp notifications failed:', error.message);
      }
    });
  }

  // Auto-increment vehicle occupancy when a payment completes.
  // Uses an atomic DB upsert so concurrent payments cannot overcount or exceed capacity.
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

      // Atomically increment — the DB rejects the update if vehicle is already full
      const { updated, row } = await OccupancyModel.incrementOccupancyIfNotFull(vehicleId, capacity);

      if (!updated) {
        // Vehicle was already full; this payment was recorded but should not have been allowed.
        // Log for debugging — the availability pre-check in initiatePayment/simulatePayment
        // should prevent reaching here under normal conditions.
        console.warn(`[autoIncrementOccupancy] vehicle ${vehicleId} was full when payment ${payment.id} completed — occupancy not changed`);
        return row;
      }

      if (io) {
        const driverId = vehicle.user_id || null;
        const payload = {
          vehicle_id: vehicleId,
          current_occupancy: row.current_occupancy,
          occupancy_status: row.occupancy_status,
          capacity,
        };
        io.to('admin').emit('vehicle.occupancyUpdated', payload);
        if (driverId) io.to(`user_${driverId}`).emit('vehicle.occupancyUpdated', payload);
        io.to(`vehicle_${vehicleId}`).emit('vehicle.occupancyUpdated', payload);
      }
      return row;
    } catch (err) {
      console.error('Auto increment occupancy error:', err.message);
    }
  }

  static async reconcilePendingPayment(payment, io = null) {
    if (!payment || payment.status !== 'pending' || !payment.checkout_request_id) {
      return payment;
    }

    paymentDebugLog('reconcile.start', {
      paymentId: payment.id,
      checkoutRequestId: payment.checkout_request_id,
      currentStatus: payment.status,
      updatedAt: payment.updated_at,
    });

    const checkoutId = payment.checkout_request_id;
    const now = Date.now();
    const lastRunAt = stkQueryLastRunByCheckout.get(checkoutId) || 0;
    if (now - lastRunAt < STK_QUERY_MIN_INTERVAL_MS) {
      paymentDebugLog('reconcile.skipped.min_interval', {
        paymentId: payment.id,
        checkoutRequestId: checkoutId,
        millisSinceLastRun: now - lastRunAt,
      });
      return payment;
    }

    stkQueryLastRunByCheckout.set(checkoutId, now);

    try {
      const statusResponse = await MpesaService.queryStkPushStatus(payment.checkout_request_id);
      const resultCode = String(
        statusResponse?.ResultCode
        ?? statusResponse?.Body?.stkCallback?.ResultCode
        ?? statusResponse?.resultCode
        ?? ''
      );
      const resultDesc =
        statusResponse?.ResultDesc
        || statusResponse?.Body?.stkCallback?.ResultDesc
        || statusResponse?.errorMessage
        || statusResponse?.resultDesc
        || 'Pending confirmation';

      // Query reached provider and returned a response; reset timeout counter.
      stkTimeoutCountByCheckout.delete(checkoutId);

      paymentDebugLog('reconcile.query.result', {
        paymentId: payment.id,
        checkoutRequestId: payment.checkout_request_id,
        resultCode,
        resultDesc,
      });

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

          const result = paymentWithDetails || updated;
          emitPaymentStatusUpdate(io, result, {
            ticket_reference: ticketReference,
            route_name: result.route_name || null,
            amount: result.amount,
          });
          if (ENABLE_AUTO_PAYMENT_WHATSAPP) {
            PaymentController.queuePaymentWhatsAppNotifications(result, ticketReference);
          }
          // Auto-increment vehicle occupancy from this completed payment
          await PaymentController.autoIncrementOccupancy(updated, io);
          paymentDebugLog('reconcile.marked.completed', {
            paymentId: updated.id,
            checkoutRequestId: updated.checkout_request_id,
            transactionId: updated.transaction_id,
            ticketReference,
          });
          stkTimeoutCountByCheckout.delete(checkoutId);
          return result;
        }
      }

      const paymentAgeMs = payment?.created_at ? Date.now() - new Date(payment.created_at).getTime() : 0;
      const isTerminalFailure = STK_TERMINAL_FAILURE_CODES.has(resultCode);
      const canFinalizeFailure = isTerminalFailure && paymentAgeMs >= STK_FAILURE_GRACE_MS;

      if (canFinalizeFailure) {
        const updatedFailed = await PaymentModel.updateStatusByCheckoutRequestId(
          payment.checkout_request_id,
          'failed',
          null,
          resultDesc
        );
        if (updatedFailed) {
          emitPaymentStatusUpdate(io, updatedFailed, {
            route_name: payment.route_name || null,
            amount: payment.amount,
          });
        }
        paymentDebugLog('reconcile.marked.failed', {
          paymentId: payment.id,
          checkoutRequestId: payment.checkout_request_id,
          resultCode,
          resultDesc,
        });
        stkTimeoutCountByCheckout.delete(checkoutId);
        return updatedFailed || payment;
      }

      if (resultCode && resultCode !== '0' && !canFinalizeFailure) {
        return payment;
      }

      return payment;
    } catch (error) {
      const errorCode = error?.response?.data?.fault?.detail?.errorcode;
      const isTimeoutError =
        error?.code === 'ECONNABORTED'
        || /timeout/i.test(String(error?.message || ''));

      if (isTimeoutError) {
        const timeoutCount = (stkTimeoutCountByCheckout.get(checkoutId) || 0) + 1;
        stkTimeoutCountByCheckout.set(checkoutId, timeoutCount);

        const paymentAgeMs = payment?.created_at ? Date.now() - new Date(payment.created_at).getTime() : 0;
        const shouldFailOnTimeouts =
          timeoutCount >= STK_TIMEOUT_FAILURE_THRESHOLD
          && paymentAgeMs >= STK_TIMEOUT_FAILURE_GRACE_MS;

        paymentDebugLog('reconcile.timeout.progress', {
          paymentId: payment.id,
          checkoutRequestId: checkoutId,
          timeoutCount,
          paymentAgeMs,
          threshold: STK_TIMEOUT_FAILURE_THRESHOLD,
          graceMs: STK_TIMEOUT_FAILURE_GRACE_MS,
          shouldFailOnTimeouts,
        });

        if (shouldFailOnTimeouts) {
          const timeoutFailureReason = 'Payment confirmation timed out. Please retry payment.';
          const updatedFailed = await PaymentModel.updateStatusByCheckoutRequestId(
            payment.checkout_request_id,
            'failed',
            null,
            timeoutFailureReason
          );

          if (updatedFailed) {
            emitPaymentStatusUpdate(io, updatedFailed, {
              route_name: payment.route_name || null,
              amount: payment.amount,
            });
          }

          paymentDebugLog('reconcile.marked.failed.timeout_fallback', {
            paymentId: payment.id,
            checkoutRequestId: checkoutId,
            timeoutCount,
            paymentAgeMs,
          });

          stkTimeoutCountByCheckout.delete(checkoutId);
          return updatedFailed || payment;
        }
      }

      if (errorCode === 'policies.ratelimit.SpikeArrestViolation') {
        // Back off briefly, but avoid minute-long freeze in UI confirmation.
        stkQueryLastRunByCheckout.set(checkoutId, now - STK_QUERY_MIN_INTERVAL_MS + STK_RATE_LIMIT_COOLDOWN_MS);
        paymentDebugLog('reconcile.ratelimited', {
          paymentId: payment.id,
          checkoutRequestId: checkoutId,
          cooldownMs: STK_RATE_LIMIT_COOLDOWN_MS,
        });
      }
      paymentDebugLog('reconcile.query.error', {
        paymentId: payment.id,
        checkoutRequestId: checkoutId,
        errorCode,
        message: error.message,
      });
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

        if (!vehicleId) {
          return res.status(404).json({ message: 'Selected vehicle was not found' });
        }

        const availability = await PaymentController.getVehiclePaymentAvailability(vehicleId);
        if (!availability.available) {
          return res.status(409).json({
            message: 'This vehicle is full. Please select another vehicle.',
            reason: availability.reason,
            vehicle_id: vehicleId,
            current_occupancy: availability.currentOccupancy,
            capacity: availability.capacity,
          });
        }
      }
      // Auto-assign the active vehicle for this route if none specified
      if (!vehicleId && parsedRouteId) {
        const activeVehicle = await VehicleModel.getActiveVehicleForRoute(parsedRouteId);
        vehicleId = activeVehicle?.id || null;
        if (!vehicleId) {
          return res.status(409).json({
            message: 'All vehicles on this route are currently full. Please try again later.',
            reason: 'ROUTE_FULL',
          });
        }
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
        const paymentWithRequestIds = await PaymentModel.updateMpesaRequestIds(
          paymentRecord.id,
          response.MerchantRequestID,
          response.CheckoutRequestID
        );

        // Emit immediately so admin/driver dashboards reflect new payment rows without waiting.
        const io = req.app.get('io') || null;
        emitPaymentStatusUpdate(io, paymentWithRequestIds || paymentRecord, {
          route_name: null,
          amount: paymentWithRequestIds?.amount || paymentRecord.amount,
        });

        const assumeSuccess = isTruthyRefresh(process.env.PAYMENT_ASSUME_SUCCESS || 'false');
        if (assumeSuccess) {
          setTimeout(async () => {
            try {
              const latest = await PaymentModel.getPaymentById(paymentRecord.id);
              if (!latest || latest.status === 'completed') return;
              await PaymentController.finalizeAssumedSuccessPayment(paymentRecord.id, io);
            } catch (assumeErr) {
              console.error('Assumed-success finalize failed:', assumeErr.message);
            }
          }, ASSUMED_SUCCESS_DELAY_MS);
        }

        paymentDebugLog('initiate.success', {
          paymentId: paymentRecord.id,
          routeId: parsedRouteId,
          amount: parsedAmount,
          checkoutRequestId: response.CheckoutRequestID,
          merchantRequestId: response.MerchantRequestID,
          phoneNumber: normalizedPhone,
          assumedSuccess: assumeSuccess,
          assumedDelayMs: assumeSuccess ? ASSUMED_SUCCESS_DELAY_MS : 0,
        });

        return res.status(200).json({
          success: true,
          message: assumeSuccess
            ? 'Check your phone for M-Pesa prompt. Payment will auto-complete in 10 seconds (project mode).'
            : 'Check your phone for M-Pesa prompt!',
          payment_id: paymentRecord.id,
          checkout_request_id: response.CheckoutRequestID,
          merchant_request_id: response.MerchantRequestID,
          assumed_completed: assumeSuccess,
          assumed_completion_delay_ms: assumeSuccess ? ASSUMED_SUCCESS_DELAY_MS : 0,
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

  // Get previous M-Pesa phone numbers for current user
  static async getPreviousPhoneNumbers(req, res) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const phones = await PaymentModel.getPreviousPhoneNumbersByUserId(userId, 10);
      
      res.status(200).json({
        success: true,
        phones: phones || []
      });
    } catch (error) {
      console.error('Error fetching previous phones:', error);
      res.status(500).json({ message: 'Failed to fetch previous phone numbers', error: error.message });
    }
  }

  // M-Pesa STK push callback (called by Safaricom)
  static async mpesaCallback(req, res) {
    try {
      const callbackBody = req.body || {};

      const resultCode =
        callbackBody?.Body?.stkCallback?.ResultCode ?? callbackBody?.ResultCode;
      const resultDesc =
        callbackBody?.Body?.stkCallback?.ResultDesc ?? callbackBody?.ResultDesc ?? 'Payment was not completed';
      const checkoutRequestId =
        callbackBody?.Body?.stkCallback?.CheckoutRequestID ?? callbackBody?.CheckoutRequestID;

      paymentDebugLog('callback.received', {
        checkoutRequestId,
        resultCode: String(resultCode),
        resultDesc,
      });

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
        const existingPayment = await PaymentModel.getPaymentByCheckoutRequestId(checkoutRequestId);
        if (existingPayment?.status === 'completed') {
          paymentDebugLog('callback.already.completed', {
            paymentId: existingPayment.id,
            checkoutRequestId,
          });
          return res.status(200).send('Success');
        }

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
        const io = req.app.get('io') || null;

        emitPaymentStatusUpdate(io, paymentWithDetails || updatedPayment, {
          ticket_reference: ticketReference,
          route_name: paymentWithDetails?.route_name || null,
          amount: updatedPayment.amount,
        });

        if (ENABLE_AUTO_PAYMENT_WHATSAPP) {
          PaymentController.queuePaymentWhatsAppNotifications(paymentWithDetails || updatedPayment, ticketReference);
        }

        console.log(`✓ Payment verified and completed for payment_id=${updatedPayment.id}`);
        paymentDebugLog('callback.marked.completed', {
          paymentId: updatedPayment.id,
          checkoutRequestId,
          transactionId: updatedPayment.transaction_id,
        });
        // Auto-increment vehicle occupancy from this completed payment
        await PaymentController.autoIncrementOccupancy(updatedPayment, io);
      } else {
        const existingPayment = await PaymentModel.getPaymentByCheckoutRequestId(checkoutRequestId);
        if (existingPayment?.status === 'completed') {
          paymentDebugLog('callback.failure.ignored_completed', {
            paymentId: existingPayment.id,
            checkoutRequestId,
            resultCode: String(resultCode),
            resultDesc,
          });
          return res.status(200).send('Success');
        }

        const failedPayment = await PaymentModel.updateStatusByCheckoutRequestId(
          checkoutRequestId,
          'failed',
          null,
          resultDesc
        );
        const io = req.app.get('io') || null;
        if (failedPayment) {
          emitPaymentStatusUpdate(io, failedPayment, {
            route_name: null,
            amount: failedPayment.amount,
          });
        }
        console.log('M-Pesa payment failed:', resultDesc);
        paymentDebugLog('callback.marked.failed', {
          paymentId: failedPayment?.id || null,
          checkoutRequestId,
          resultCode: String(resultCode),
          resultDesc,
        });
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
      const io = req.app.get('io') || null;
      const userId = req.userId || null;
      const { routeId, amount, distance = 0, phoneNumber, vehicle, vehicleNumber } = req.body;

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

      let vehicleId = null;
      const incomingVehicle = String(vehicle || vehicleNumber || '').trim().toUpperCase();
      if (incomingVehicle) {
        const foundVehicle = await VehicleModel.getVehicleByRegistration(incomingVehicle);
        vehicleId = foundVehicle?.id || null;

        if (!vehicleId) {
          return res.status(404).json({ message: 'Selected vehicle was not found' });
        }

        const availability = await PaymentController.getVehiclePaymentAvailability(vehicleId);
        if (!availability.available) {
          return res.status(409).json({
            message: 'This vehicle is full. Please select another vehicle.',
            reason: availability.reason,
            vehicle_id: vehicleId,
            current_occupancy: availability.currentOccupancy,
            capacity: availability.capacity,
          });
        }
      }

      // Auto-assign the active vehicle for this route if none specified
      if (!vehicleId) {
        const activeVehicle = await VehicleModel.getActiveVehicleForRoute(Number(routeId));
        vehicleId = activeVehicle?.id || null;
        if (!vehicleId) {
          return res.status(409).json({
            message: 'All vehicles on this route are currently full. Please try again later.',
            reason: 'ROUTE_FULL',
          });
        }
      }

      // Create payment record with distance
      const payment = await PaymentModel.initiatePayment(userId, routeId, amount, phoneNumber, vehicleId, distance);

      // Simulate M-Pesa STK Push (no real funds)
      // In real scenario, this would trigger an actual M-Pesa STK prompt
      const simulatedTransactionId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Simulate successful payment after 2 seconds
      setTimeout(async () => {
        try {
          const updatedPayment = await PaymentModel.updatePaymentStatus(payment.id, 'completed', simulatedTransactionId);
          if (updatedPayment) {
            const paymentWithDetails = await PaymentModel.getPaymentByIdWithDetails(updatedPayment.id) || updatedPayment;
            emitPaymentStatusUpdate(io, paymentWithDetails, {
              ticket_reference: getSafeTicketReference(paymentWithDetails),
              route_name: paymentWithDetails.route_name || null,
              amount: paymentWithDetails.amount,
            });
            // Increment vehicle occupancy now that payment is confirmed
            await PaymentController.autoIncrementOccupancy(paymentWithDetails, io);
          }
        } catch (simulateUpdateError) {
          console.error('Simulated payment completion update error:', simulateUpdateError.message);
        }
      }, 2000);

      // Send notifications asynchronously so API responds immediately
      setImmediate(async () => {
        try {
          await SmsService.sendSms(
            phoneNumber,
            `M-Pesa Payment Simulated: KES ${amount} for route. Transaction ID: ${simulatedTransactionId}`
          );
        } catch (smsError) {
          console.error('SMS notification failed:', smsError);
        }

        if (ENABLE_AUTO_PAYMENT_WHATSAPP) {
          try {
            const whatsappResult = await WhatsappService.sendPaymentConfirmation(phoneNumber, {
              routeName: `Route ${routeId}`,
              vehicleNumber: incomingVehicle || undefined,
              amount: amount,
              transactionId: simulatedTransactionId
            });

            if (whatsappResult?.success === false && (whatsappResult.needsJoin || whatsappResult.code === 63007)) {
              try {
                const joinInstructions = `MatatuConnect: Payment received KES ${amount}! Get WhatsApp alerts - Send "join break-additional" to +14155238886. Takes 5 sec!`;
                await SmsService.sendSms(phoneNumber, joinInstructions);
              } catch (smsFallbackError) {
                console.error('SMS join instructions failed:', smsFallbackError.message);
              }
            }
          } catch (whatsappError) {
            console.error('WhatsApp notification failed:', whatsappError.message);
          }
        }
      });

      res.status(201).json({
        message: 'M-Pesa STK simulation initiated',
        payment: {
          ...payment,
          simulationNote: 'This is a simulated payment. No real funds will be transferred.'
        },
        simulatedStatus: 'STK Prompt Sent (Simulated)',
        notificationsSent: {
          sms: false,
          whatsapp: false,
          queued: ENABLE_AUTO_PAYMENT_WHATSAPP
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
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');

      const { paymentId } = req.params;
      const shouldRefresh = isTruthyRefresh(req.query.refresh);

      let payment = await PaymentModel.getPaymentByIdWithDetails(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      const lastUpdatedAt = payment.updated_at ? new Date(payment.updated_at).getTime() : 0;
      const pendingStaleMs = lastUpdatedAt ? Date.now() - lastUpdatedAt : Number.POSITIVE_INFINITY;
      const shouldAutoRefreshPending = payment.status === 'pending' && pendingStaleMs > STK_QUERY_MIN_INTERVAL_MS;

      paymentDebugLog('status.request', {
        paymentId: Number(paymentId),
        checkoutRequestId: payment.checkout_request_id,
        currentStatus: payment.status,
        shouldRefresh,
        shouldAutoRefreshPending,
        pendingStaleMs,
      });

      if ((shouldRefresh || shouldAutoRefreshPending) && payment.status === 'pending') {
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

      paymentDebugLog('status.response', {
        paymentId: Number(paymentId),
        checkoutRequestId: payment.checkout_request_id,
        responseStatus: payment.status,
        transactionId: payment.transaction_id || null,
        failureReason: payment.failure_reason || null,
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
