const axios = require('axios');

class SmsService {
  constructor() {
    this.apiKey = process.env.AFRICAS_TALKING_API_KEY;
    this.apiUsername = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';
    this.baseUrl = 'https://api.sandbox.africastalking.com/version1/messaging';
  }

  async sendSms(phoneNumber, message) {
    try {
      // Format phone number to international format if needed
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Prepare form data
      const data = new URLSearchParams();
      data.append('username', this.apiUsername);
      data.append('to', formattedPhone);
      data.append('message', message);

      const response = await axios.post(
        this.baseUrl,
        data,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': this.apiKey,
          },
        }
      );

      console.log('SMS sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
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
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
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
