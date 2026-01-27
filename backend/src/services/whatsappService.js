const axios = require('axios');

class WhatsAppService {
  async sendMessage(phoneNumber, message) {
    try {
      // Format phone number for WhatsApp (remove leading +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

      const response = await axios.post(
        `https://graph.instagram.com/${process.env.WHATSAPP_API_VERSION}/me/messages`,
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
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('WhatsApp message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('WhatsApp message sending error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendFeedbackConfirmation(phoneNumber, feedbackData) {
    const message = `
✅ *Feedback Received*
Thank you for your ${feedbackData.feedbackType.toLowerCase()}!

Route: ${feedbackData.routeName}
Vehicle: ${feedbackData.vehicleReg}
Feedback ID: ${feedbackData.feedbackId}

We appreciate your input to help improve our service. Our team will review your feedback shortly.

Best regards,
MatatuConnect Team
    `.trim();
    return this.sendMessage(phoneNumber, message);
  }

  async sendPaymentNotification(phoneNumber, paymentData) {
    const message = `
💰 *Payment Simulation Confirmed*
Your M-Pesa payment simulation has been recorded.

Amount: KES ${paymentData.amount}
Route: ${paymentData.routeName}
Transaction ID: ${paymentData.transactionId}
Status: Simulated (No real funds transferred)

This is a prototype demonstration. Thank you for using MatatuConnect!

Best regards,
MatatuConnect Team
    `.trim();
    return this.sendMessage(phoneNumber, message);
  }

  async sendOccupancyAlert(phoneNumber, occupancyData) {
    const message = `
🚌 *Occupancy Update*
Vehicle Status Changed

Vehicle: ${occupancyData.vehicleReg}
Status: ${occupancyData.status === 'available' ? 'Seats Available ✅' : 'Vehicle Full 🚫'}
Updated: ${new Date().toLocaleTimeString()}

Check the app for more details!

Best regards,
MatatuConnect Team
    `.trim();
    return this.sendMessage(phoneNumber, message);
  }

  async sendServiceAlert(phoneNumber, alertMessage) {
    return this.sendMessage(phoneNumber, alertMessage);
  }
}

module.exports = new WhatsAppService();
