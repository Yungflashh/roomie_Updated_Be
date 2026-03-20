declare class PaystackService {
    /**
     * Initialize a transaction — returns authorization_url for the user to pay
     */
    initializeTransaction(data: {
        email: string;
        amount: number;
        reference: string;
        metadata?: any;
        callback_url?: string;
    }): Promise<{
        authorization_url: string;
        access_code: string;
        reference: string;
    }>;
    /**
     * Verify a transaction by reference
     */
    verifyTransaction(reference: string): Promise<{
        status: string;
        amount: number;
        currency: string;
        reference: string;
        metadata: any;
        paid_at: string;
        channel: string;
    }>;
    /**
     * Validate webhook signature
     */
    validateWebhook(body: string, signature: string): boolean;
}
declare const _default: PaystackService;
export default _default;
//# sourceMappingURL=paystack.service.d.ts.map