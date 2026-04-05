"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
if (!PAYSTACK_SECRET) {
    console.warn('⚠️  WARNING: PAYSTACK_SECRET_KEY is not set. Payment features will not work.');
}
const PAYSTACK_BASE = 'https://api.paystack.co';
const paystackApi = axios_1.default.create({
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
    async initializeTransaction(data) {
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
            logger_1.default.info(`Paystack transaction initialized: ${data.reference}`);
            return response.data.data;
        }
        catch (error) {
            logger_1.default.error('Paystack init error:', error.response?.data || error.message);
            throw new Error('Payment initialization failed');
        }
    }
    /**
     * Verify a transaction by reference
     */
    async verifyTransaction(reference) {
        try {
            const response = await paystackApi.get(`/transaction/verify/${reference}`);
            if (!response.data.status) {
                throw new Error('Transaction verification failed');
            }
            const txn = response.data.data;
            logger_1.default.info(`Paystack transaction verified: ${reference} — status: ${txn.status}`);
            return {
                status: txn.status,
                amount: txn.amount,
                currency: txn.currency,
                reference: txn.reference,
                metadata: txn.metadata,
                paid_at: txn.paid_at,
                channel: txn.channel,
            };
        }
        catch (error) {
            logger_1.default.error('Paystack verify error:', error.response?.data || error.message);
            throw new Error('Payment verification failed');
        }
    }
    /**
     * Validate webhook signature
     */
    validateWebhook(body, signature) {
        const crypto = require('crypto');
        const secret = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET;
        if (!secret) {
            console.error('FATAL: No Paystack webhook secret configured. Rejecting all webhooks.');
            return false;
        }
        const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
        return hash === signature;
    }
}
exports.default = new PaystackService();
//# sourceMappingURL=paystack.service.js.map