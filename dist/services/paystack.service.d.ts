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
    /**
     * Get list of Nigerian banks supported by Paystack
     */
    listBanks(country?: string): Promise<Array<{
        name: string;
        code: string;
        slug: string;
    }>>;
    /**
     * Resolve a bank account — returns the account holder's name if valid
     */
    resolveAccount(accountNumber: string, bankCode: string): Promise<{
        account_name: string;
        account_number: string;
    }>;
    /**
     * Create a transfer recipient — a person/bank to send money to
     * Required before initiating any transfer
     */
    createTransferRecipient(data: {
        name: string;
        accountNumber: string;
        bankCode: string;
    }): Promise<{
        recipient_code: string;
        id: number;
    }>;
    /**
     * Initiate a transfer (payout) from your Paystack balance to a recipient
     * amount is in KOBO
     */
    initiateTransfer(data: {
        amount: number;
        recipientCode: string;
        reason: string;
        reference: string;
    }): Promise<{
        transfer_code: string;
        reference: string;
        status: string;
    }>;
    /**
     * Refund a transaction (full or partial)
     * amount is in KOBO. If omitted, refunds full amount.
     */
    refundTransaction(reference: string, amount?: number): Promise<any>;
}
declare const _default: PaystackService;
export default _default;
//# sourceMappingURL=paystack.service.d.ts.map