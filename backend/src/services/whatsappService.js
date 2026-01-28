const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  validateConfig() {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp credentials not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN');
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove leading +, spaces, and dashes
    let formatted = phoneNumber.replace(/[\s\-\+]/g, '');
    // If starts with 0, replace with 254 (Kenya)
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    }
    // If doesn't start with country code, assume Kenya
    if (!formatted.startsWith('254') && !formatted.startsWith('+')) {
      formatted = '254' + formatted;
    }
    return formatted;
  }

  async sendMessage(phoneNumber, message) {
    try {
      this.validateConfig();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✓ WhatsApp message sent:', { phone: formattedPhone, messageId: response.data.messages?.[0]?.id });
      return { success: true, messageId: response.data.messages?.[0]?.id, data: response.data };
    } catch (error) {
      console.error('✗ WhatsApp sending failed:', {
        phone: phoneNumber,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  async sendFeedbackConfirmation(phoneNumber, feedbackData) {
    const message = `✅ *Feedback Received*
Thank you for your ${feedbackData.feedbackType.toLowerCase()}!

Route: ${feedbackData.routeName || 'N/A'}
Vehicle: ${feedbackData.vehicleReg || 'N/A'}
Feedback ID: ${feedbackData.feedbackId}

We appreciate your input to help improve our service. Your feedback helps us serve you better!`;
    return this.sendMessage(phoneNumber, message);
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
    return this.sendMessage(phoneNumber, message);
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
    return this.sendMessage(phoneNumber, message);
  }

  async sendServiceAlert(phoneNumber, alertMessage) {
    return this.sendMessage(phoneNumber, alertMessage);
  }

  async sendComplaintAcknowledgment(phoneNumber, complaintData) {
    const message = `📋 *Complaint Registered*

Complaint Type: ${complaintData.complaintType || 'General'}
Complaint ID: ${complaintData.complaintId}
Vehicle: ${complaintData.vehicleReg || 'N/A'}
Route: ${complaintData.routeName || 'N/A'}

⏱️ We'll investigate and get back to you within 24 hours.
📞 Support: Contact us at +254712345678`;
    return this.sendMessage(phoneNumber, message);
  }

  async sendInteractiveMessage(phoneNumber, title, options) {
    try {
      this.validateConfig();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const buttons = options.map((opt, index) => ({
        type: 'reply',
        reply: {
          id: `btn_${index}`,
          title: opt.title
        }
      }));

      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: title },
            action: { buttons: buttons.slice(0, 3) } // WhatsApp limits to 3 buttons
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✓ Interactive message sent:', formattedPhone);
      return { success: true, messageId: response.data.messages?.[0]?.id };
    } catch (error) {
      console.error('✗ Interactive message failed:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
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
