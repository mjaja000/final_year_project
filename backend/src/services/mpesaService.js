const axios = require('axios');

class MpesaService {
  static formatTimestamp() {
    // Daraja expects YYYYMMDDHHMMSS
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  }

  static buildPassword(timestamp) {
    const businessCode = process.env.MPESA_BUSINESS_CODE || process.env.MPESA_SHORTCODE;
    if (!businessCode || !process.env.MPESA_PASSKEY) {
      throw new Error('Missing M-Pesa business code or passkey');
    }
    return Buffer.from(
      `${businessCode}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');
  }

  static async getAccessToken() {
    try {
      if (!process.env.MPESA_API_URL) {
        throw new Error('Missing MPESA_API_URL');
      }
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

  static async initiateStkPush({ amount, phoneNumber, accountReference, transactionDesc, callbackUrl }) {
    try {
      const businessCode = process.env.MPESA_BUSINESS_CODE || process.env.MPESA_SHORTCODE;
      if (!businessCode) {
        throw new Error('Missing M-Pesa business code');
      }
      const accessToken = await this.getAccessToken();
      const timestamp = this.formatTimestamp();
      const password = this.buildPassword(timestamp);

      const response = await axios.post(
        `${process.env.MPESA_API_URL}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: businessCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: String(amount),
          PartyA: phoneNumber,
          PartyB: businessCode,
          PhoneNumber: phoneNumber,
          CallBackURL: callbackUrl || process.env.MPESA_CALLBACK_URL,
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('M-Pesa STK push initiation error:', error);
      throw error;
    }
  }

  static async validateTransaction(transactionId) {
    try {
      const businessCode = process.env.MPESA_BUSINESS_CODE || process.env.MPESA_SHORTCODE;
      if (!businessCode) {
        throw new Error('Missing M-Pesa business code');
      }
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${process.env.MPESA_API_URL}/mpesa/transactionstatus/v1/query`,
        {
          Initiator: businessCode,
          SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
          CommandID: 'TransactionStatusQuery',
          TransactionID: transactionId,
          PartyA: businessCode,
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
