const twilio = require('twilio');
const MessageModel = require('../models/messageModel');

class WhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  validateConfig() {
    if (!this.accountSid || !this.authToken || !this.whatsappNumber) {
      throw new Error('Twilio WhatsApp credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER');
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove spaces and dashes, keep +
    let formatted = phoneNumber.replace(/[\s\-]/g, '');
    // If starts with 0, replace with +254 (Kenya)
    if (formatted.startsWith('0')) {
      formatted = '+254' + formatted.substring(1);
    }
    // If doesn't start with +, add it and assume Kenya
    if (!formatted.startsWith('+')) {
      if (formatted.startsWith('254')) {
        formatted = '+' + formatted;
      } else {
        formatted = '+254' + formatted;
      }
    }
    // Twilio requires whatsapp: prefix
    return `whatsapp:${formatted}`;
  }

  normalizePhoneForStorage(phoneNumber) {
    if (!phoneNumber) return null;
    return String(phoneNumber).replace(/[^0-9]/g, '');
  }

  async sendMessage(phoneNumber, message, messageType = 'general') {
    try {
      this.validateConfig();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const storagePhone = this.normalizePhoneForStorage(phoneNumber);

      const response = await this.client.messages.create({
        from: this.whatsappNumber,
        to: formattedPhone,
        body: message,
      });

      console.log('✓ WhatsApp message sent via Twilio:', { phone: formattedPhone, sid: response.sid });

      // Store outgoing message in database
      try {
        await MessageModel.createWhatsAppMessage({
          phone: storagePhone,
          messageId: response.sid,
          direction: 'outgoing',
          messageType: messageType,
          message: message,
          isRead: true
        });
        console.log('✓ WhatsApp message stored in database');
      } catch (dbError) {
        console.error('✗ Failed to store WhatsApp message:', dbError.message);
      }

      return { success: true, messageId: response.sid, data: response };
    } catch (error) {
      console.error('✗ WhatsApp sending failed:', {
        phone: phoneNumber,
        error: error.message,
        code: error.code
      });
      
      // Error 63007: Not in sandbox - send SMS fallback with join instructions
      if (error.code === 63007) {
        console.log('⚠️ User not in WhatsApp sandbox. They need to join first.');
        return { 
          success: false, 
          error: error.message, 
          code: 63007,
          needsJoin: true,
          joinInstructions: 'Send "join break-additional" to +1 415 523 8886 on WhatsApp'
        };
      }
      
      return { success: false, error: error.message, code: error.code };
    }
  }

  /**
   * Send sandbox join instructions to a user
   * @param {string} phoneNumber - User's phone number
   * @returns {Promise} Result of sending instructions
   */
  async sendJoinInstructions(phoneNumber) {
    const joinMessage = `🎯 *MatatuConnect - Setup Required*

To get WhatsApp notifications:

📝 *STEP 1:*
Send this exact message:
*join break-additional*

📱 *STEP 2:*
Send it to: *+1 415 523 8886*

⏱ *Duration:* 72 hours (rejoin anytime)

✨ *You'll receive:*
✅ Payment confirmations
✅ Feedback alerts
✅ Occupancy updates

Do it now - takes 5 seconds!`;
    
    return this.sendMessage(phoneNumber, joinMessage, 'join_instructions');
  }

  async sendFeedbackConfirmation(phoneNumber, feedbackData) {
    const message = `✅ *Feedback Received*
Thank you for your ${feedbackData.feedbackType.toLowerCase()}!

Route: ${feedbackData.routeName || 'N/A'}
Vehicle: ${feedbackData.vehicleReg || 'N/A'}
Feedback ID: ${feedbackData.feedbackId}

We appreciate your input to help improve our service. Your feedback helps us serve you better!`;
    return this.sendMessage(phoneNumber, message, 'feedback_confirmation');
  }

  async sendPaymentConfirmation(phoneNumber, paymentData) {
    const date = new Date().toLocaleDateString('en-KE');
    const message = `💰 *Payment Confirmed*
Your payment has been recorded.

📍 Route: ${paymentData.routeName || 'N/A'}
💵 Amount: KES ${paymentData.amount}
🎟️ Transaction: ${paymentData.transactionId}
📅 Date: ${date}

Thank you for using MatatuConnect!`;
    return this.sendMessage(phoneNumber, message, 'payment_confirmation');
  }

  async sendPaymentNotification(phoneNumber, paymentData) {
    // Alias for sendPaymentConfirmation
    return this.sendPaymentConfirmation(phoneNumber, paymentData);
  }

  async sendOccupancyAlert(phoneNumber, occupancyData) {
    const status = occupancyData.status === 'available' ? '✅ Seats Available' : '🚫 Vehicle Full';
    const message = `🚌 *Occupancy Update*

Vehicle: ${occupancyData.vehicleReg || 'N/A'}
Status: ${status}
Route: ${occupancyData.routeName || 'N/A'}
Time: ${new Date().toLocaleTimeString('en-KE')}

Check the MatatuConnect app for more details!`;
    return this.sendMessage(phoneNumber, message, 'occupancy_alert');
  }

  async sendServiceAlert(phoneNumber, alertMessage) {
    return this.sendMessage(phoneNumber, alertMessage, 'service_alert');
  }

  async sendComplaintAcknowledgment(phoneNumber, complaintData) {
    const message = `📋 *Complaint Registered*

Complaint Type: ${complaintData.complaintType || 'General'}
Complaint ID: ${complaintData.complaintId}
Vehicle: ${complaintData.vehicleReg || 'N/A'}
Route: ${complaintData.routeName || 'N/A'}

⏱️ We'll investigate and get back to you within 24 hours.
📞 Support: Contact us at +254712345678`;
    return this.sendMessage(phoneNumber, message, 'complaint_acknowledgment');
  }

  async sendInteractiveMessage(phoneNumber, title, options, messageType = 'interactive_menu') {
    // Twilio WhatsApp doesn't support interactive buttons in sandbox
    // Fall back to text message with numbered options
    const optionsText = options.map((opt, idx) => `${idx + 1}. ${opt.title}`).join('\n');
    const message = `${title}\n\n${optionsText}\n\nReply with the number of your choice.`;
    return this.sendMessage(phoneNumber, message, messageType);
  }

  async sendRatingRequest(phoneNumber, feedbackId) {
    const options = [
      { title: '⭐ Poor' },
      { title: '⭐⭐ Fair' },
      { title: '⭐⭐⭐ Good' },
      { title: '⭐⭐⭐⭐ Excellent' }
    ];

    return this.sendInteractiveMessage(
      phoneNumber,
      `How would you rate your experience? (Feedback ID: ${feedbackId})`,
      options.slice(0, 3)
    );
  }
}

module.exports = new WhatsAppService();
