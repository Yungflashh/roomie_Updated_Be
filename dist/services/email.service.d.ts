declare class EmailService {
    private send;
    sendVerificationCode(to: string, firstName: string, code: string): Promise<void>;
    sendPasswordResetCode(to: string, firstName: string, code: string): Promise<void>;
    sendPasswordResetSuccess(to: string, firstName: string): Promise<void>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=email.service.d.ts.map