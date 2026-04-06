const axios = require('axios');

const MPESA_HTTP_TIMEOUT_MS = Number(process.env.MPESA_HTTP_TIMEOUT_MS || 8000);

const paymentDebugLog = (event, meta = {}) => {
  console.log(`[PAYMENT_DEBUG] ${new Date().toISOString()} ${event}`, meta);
};

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
    const startedAt = Date.now();
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
          timeout: MPESA_HTTP_TIMEOUT_MS,
        }
      );

      paymentDebugLog('mpesa.access_token.success', {
        status: response.status,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
      });

      return response.data.access_token;
    } catch (error) {
      paymentDebugLog('mpesa.access_token.error', {
        status: error?.response?.status || null,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
        message: error.message,
      });
      console.error('M-Pesa access token error:', error);
      throw error;
    }
  }

  static async initiateStkPush({ amount, phoneNumber, accountReference, transactionDesc, callbackUrl }) {
    const startedAt = Date.now();
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
          timeout: MPESA_HTTP_TIMEOUT_MS,
        }
      );

      paymentDebugLog('mpesa.stk_push.success', {
        status: response.status,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
        amount,
        phoneNumber,
        responseCode: response.data?.ResponseCode || null,
        merchantRequestId: response.data?.MerchantRequestID || null,
        checkoutRequestId: response.data?.CheckoutRequestID || null,
      });

      return response.data;
    } catch (error) {
      paymentDebugLog('mpesa.stk_push.error', {
        status: error?.response?.status || null,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
        amount,
        phoneNumber,
        message: error.message,
        providerError: error?.response?.data || null,
      });
      console.error('M-Pesa STK push initiation error:', error);
      throw error;
    }
  }

  static async queryStkPushStatus(checkoutRequestId) {
    const startedAt = Date.now();
    try {
      if (!checkoutRequestId) {
        throw new Error('Missing checkoutRequestId for STK status query');
      }

      const businessCode = process.env.MPESA_BUSINESS_CODE || process.env.MPESA_SHORTCODE;
      if (!businessCode) {
        throw new Error('Missing M-Pesa business code');
      }

      const accessToken = await this.getAccessToken();
      const timestamp = this.formatTimestamp();
      const password = this.buildPassword(timestamp);

      const response = await axios.post(
        `${process.env.MPESA_API_URL}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: businessCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: MPESA_HTTP_TIMEOUT_MS,
        }
      );

      paymentDebugLog('mpesa.stk_query.success', {
        status: response.status,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
        checkoutRequestId,
        resultCode: response.data?.ResultCode ?? response.data?.Body?.stkCallback?.ResultCode ?? null,
        resultDesc: response.data?.ResultDesc ?? response.data?.Body?.stkCallback?.ResultDesc ?? null,
      });

      return response.data;
    } catch (error) {
      paymentDebugLog('mpesa.stk_query.error', {
        status: error?.response?.status || null,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
        checkoutRequestId,
        message: error.message,
        providerError: error?.response?.data || null,
      });
      console.error('M-Pesa STK query error:', error?.response?.data || error.message);
      throw error;
    }
  }

  static async validateTransaction(transactionId) {
    const startedAt = Date.now();
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
          timeout: MPESA_HTTP_TIMEOUT_MS,
        }
      );

      paymentDebugLog('mpesa.tx_query.success', {
        status: response.status,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
        transactionId,
      });

      return response.data;
    } catch (error) {
      paymentDebugLog('mpesa.tx_query.error', {
        status: error?.response?.status || null,
        durationMs: Date.now() - startedAt,
        timeoutMs: MPESA_HTTP_TIMEOUT_MS,
        transactionId,
        message: error.message,
        providerError: error?.response?.data || null,
      });
      console.error('M-Pesa transaction validation error:', error);
      throw error;
    }
  }
}

module.exports = MpesaService;
