const axios = require('axios');

class MpesaService {
  static async getAccessToken() {
    try {
      const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
      ).toString('base64');

      const response = await axios.get(
        `${process.env.MPESA_API_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('M-Pesa access token error:', error);
      throw error;
    }
  }

  static async initiatePayment(paymentId, amount, phoneNumber) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);

      const password = Buffer.from(
        `${process.env.MPESA_BUSINESS_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
      ).toString('base64');

      const response = await axios.post(
        `${process.env.MPESA_API_URL}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: process.env.MPESA_BUSINESS_CODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: process.env.MPESA_BUSINESS_CODE,
          PhoneNumber: phoneNumber,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: `Payment_${paymentId}`,
          TransactionDesc: `Matatu Fare Payment - ${paymentId}`,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('M-Pesa payment initiation error:', error);
      throw error;
    }
  }

  static async validateTransaction(transactionId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${process.env.MPESA_API_URL}/mpesa/transactionstatus/v1/query`,
        {
          Initiator: process.env.MPESA_BUSINESS_CODE,
          SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
          CommandID: 'TransactionStatusQuery',
          TransactionID: transactionId,
          PartyA: process.env.MPESA_BUSINESS_CODE,
          IdentifierType: 4,
          ResultURL: process.env.MPESA_CALLBACK_URL,
          QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
          Remarks: 'Transaction Status Query',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('M-Pesa transaction validation error:', error);
      throw error;
    }
  }
}

module.exports = MpesaService;
