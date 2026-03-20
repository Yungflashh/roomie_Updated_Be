import axios from 'axios';
import logger from '../utils/logger';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE = 'https://api.paystack.co';

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
  },
});

class PaystackService {
  /**
   * Initialize a transaction — returns authorization_url for the user to pay
   */
  async initializeTransaction(data: {
    email: string;
    amount: number; // in kobo (NGN * 100)
    reference: string;
    metadata?: any;
    callback_url?: string;
  }): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    try {
      const response = await paystackApi.post('/transaction/initialize', {
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        metadata: data.metadata,
        callback_url: data.callback_url,
        currency: 'NGN',
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Paystack initialization failed');
      }

      logger.info(`Paystack transaction initialized: ${data.reference}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Paystack init error:', error.response?.data || error.message);
      throw new Error('Payment initialization failed');
    }
  }

  /**
   * Verify a transaction by reference
   */
  async verifyTransaction(reference: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    reference: string;
    metadata: any;
    paid_at: string;
    channel: string;
  }> {
    try {
      const response = await paystackApi.get(`/transaction/verify/${reference}`);

      if (!response.data.status) {
        throw new Error('Transaction verification failed');
      }

      const txn = response.data.data;
      logger.info(`Paystack transaction verified: ${reference} — status: ${txn.status}`);
      return {
        status: txn.status,
        amount: txn.amount,
        currency: txn.currency,
        reference: txn.reference,
        metadata: txn.metadata,
        paid_at: txn.paid_at,
        channel: txn.channel,
      };
    } catch (error: any) {
      logger.error('Paystack verify error:', error.response?.data || error.message);
      throw new Error('Payment verification failed');
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(body: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET;
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
    return hash === signature;
  }
}

export default new PaystackService();
