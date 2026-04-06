const twilio = require('twilio');

class SmsService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.smsSenderNumber = process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || null;
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || null;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  async sendSms(phoneNumber, message) {
    try {
      if (!this.client) {
        throw new Error('Twilio SMS credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
      }

      if (!this.smsSenderNumber && !this.messagingServiceSid) {
        throw new Error('Twilio SMS sender not configured. Set TWILIO_SMS_NUMBER (recommended) or TWILIO_MESSAGING_SERVICE_SID.');
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const requestPayload = {
        body: message,
        to: formattedPhone,
      };

      if (this.messagingServiceSid) {
        requestPayload.messagingServiceSid = this.messagingServiceSid;
      } else {
        requestPayload.from = this.smsSenderNumber;
      }

      const response = await this.client.messages.create(requestPayload);

      console.log('✓ SMS sent successfully via Twilio:', { 
        sid: response.sid, 
        to: formattedPhone, 
        status: response.status 
      });
      
      return { 
        success: true, 
        messageId: response.sid, 
        status: response.status 
      };
    } catch (error) {
      if (String(error.message || '').includes("Mismatch between the 'From' number")) {
        throw new Error(
          `Twilio sender mismatch: ${this.smsSenderNumber} is not in account ${this.accountSid}. Use a Twilio number from this same account, or set TWILIO_MESSAGING_SERVICE_SID.`
        );
      }
      if (String(error.message || '').includes('Trial accounts cannot send messages to unverified numbers')) {
        throw new Error(
          'Twilio trial restriction: recipient number is not verified. Verify the destination number in Twilio Console or upgrade the account to send SMS to unverified numbers.'
        );
      }
      console.error('❌ SMS sending error via Twilio:', error.message);
      throw error;
    }
  }

  async sendFeedbackConfirmation(phoneNumber, feedbackId) {
    const message = `MatatuConnect: Thank you for your feedback! ID: ${feedbackId}. We appreciate your input.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendPaymentConfirmation(phoneNumber, transactionId, amount) {
    const message = `MatatuConnect: Payment simulated KES ${amount}. TX ID: ${transactionId}. Thank you for using MatatuConnect!`;
    return this.sendSms(phoneNumber, message);
  }

  async sendOccupancyAlert(phoneNumber, vehicleReg, status) {
    const message = `MatatuConnect: Vehicle ${vehicleReg} occupancy is now ${status === 'available' ? 'Available' : 'Full'}.`;
    return this.sendSms(phoneNumber, message);
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let cleaned = String(phoneNumber || '').replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it's a Kenya number
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        cleaned = '+254' + cleaned.substring(1);
      } else if (!cleaned.startsWith('254')) {
        cleaned = '+254' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }
}

module.exports = new SmsService();
