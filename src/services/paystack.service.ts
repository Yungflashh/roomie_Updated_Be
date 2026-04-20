import axios from 'axios';
import logger from '../utils/logger';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
if (!PAYSTACK_SECRET) {
  console.warn('WARNING: PAYSTACK_SECRET_KEY is not set. Payment features will not work.');
}
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
    if (!secret) {
      console.error('FATAL: No Paystack webhook secret configured. Rejecting all webhooks.');
      return false;
    }
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
    return hash === signature;
  }

  /**
   * Get list of Nigerian banks supported by Paystack
   */
  async listBanks(country: string = 'nigeria'): Promise<Array<{ name: string; code: string; slug: string }>> {
    try {
      const response = await paystackApi.get(`/bank?country=${country}`);
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to fetch banks');
      }
      return response.data.data.map((b: any) => ({
        name: b.name,
        code: b.code,
        slug: b.slug,
      }));
    } catch (error: any) {
      logger.error('Paystack list banks error:', error.response?.data || error.message);
      throw new Error('Failed to fetch bank list');
    }
  }

  /**
   * Resolve a bank account — returns the account holder's name if valid
   */
  async resolveAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
    try {
      const response = await paystackApi.get(
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
      );
      if (!response.data.status) {
        throw new Error(response.data.message || 'Account resolution failed');
      }
      return {
        account_name: response.data.data.account_name,
        account_number: response.data.data.account_number,
      };
    } catch (error: any) {
      logger.error('Paystack resolve account error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Could not verify bank account. Please check your details.'
      );
    }
  }

  /**
   * Create a transfer recipient — a person/bank to send money to
   * Required before initiating any transfer
   */
  async createTransferRecipient(data: {
    name: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<{ recipient_code: string; id: number }> {
    try {
      const response = await paystackApi.post('/transferrecipient', {
        type: 'nuban',
        name: data.name,
        account_number: data.accountNumber,
        bank_code: data.bankCode,
        currency: 'NGN',
      });
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to create transfer recipient');
      }
      logger.info(`Paystack recipient created: ${response.data.data.recipient_code}`);
      return {
        recipient_code: response.data.data.recipient_code,
        id: response.data.data.id,
      };
    } catch (error: any) {
      logger.error('Paystack create recipient error:', error.response?.data || error.message);
      throw new Error('Failed to create payout recipient');
    }
  }

  /**
   * Initiate a transfer (payout) from your Paystack balance to a recipient
   * amount is in KOBO
   */
  async initiateTransfer(data: {
    amount: number; // kobo
    recipientCode: string;
    reason: string;
    reference: string;
  }): Promise<{
    transfer_code: string;
    reference: string;
    status: string;
  }> {
    try {
      const response = await paystackApi.post('/transfer', {
        source: 'balance',
        amount: data.amount,
        recipient: data.recipientCode,
        reason: data.reason,
        reference: data.reference,
      });
      if (!response.data.status) {
        throw new Error(response.data.message || 'Transfer initiation failed');
      }
      logger.info(`Paystack transfer initiated: ${data.reference}, status: ${response.data.data.status}`);
      return {
        transfer_code: response.data.data.transfer_code,
        reference: response.data.data.reference,
        status: response.data.data.status,
      };
    } catch (error: any) {
      logger.error('Paystack initiate transfer error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Failed to initiate payout. Please try again later.'
      );
    }
  }

  /**
   * Refund a transaction (full or partial)
   * amount is in KOBO. If omitted, refunds full amount.
   */
  async refundTransaction(reference: string, amount?: number): Promise<any> {
    try {
      const payload: any = { transaction: reference };
      if (amount) payload.amount = amount;
      const response = await paystackApi.post('/refund', payload);
      if (!response.data.status) {
        throw new Error(response.data.message || 'Refund failed');
      }
      logger.info(`Paystack refund initiated for ${reference}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Paystack refund error:', error.response?.data || error.message);
      throw new Error('Refund failed. Please contact support.');
    }
  }
}

export default new PaystackService();
