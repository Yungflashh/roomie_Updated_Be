import { Resend } from 'resend';
import logger from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Roomie <onboarding@resend.dev>';

class EmailService {
  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });

      if (error) {
        logger.error('Resend error:', error);
        throw new Error('Failed to send email');
      }

      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error('Email send error:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationCode(to: string, firstName: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc;">
        <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; background: #0d9488; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: #fff; font-size: 24px; font-weight: 700;">R</span>
            </div>
          </div>
          <h2 style="color: #1e293b; text-align: center; margin-bottom: 8px;">Verify Your Email</h2>
          <p style="color: #64748b; text-align: center; margin-bottom: 24px;">
            Hey ${firstName}, welcome to Roomie! Use this code to verify your email address:
          </p>
          <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0d9488;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center;">
            This code expires in 15 minutes. If you didn't create an account, ignore this email.
          </p>
        </div>
      </div>
    `;
    await this.send(to, 'Verify Your Roomie Account', html);
  }

  async sendPasswordResetCode(to: string, firstName: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc;">
        <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; background: #0d9488; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: #fff; font-size: 24px; font-weight: 700;">R</span>
            </div>
          </div>
          <h2 style="color: #1e293b; text-align: center; margin-bottom: 8px;">Reset Your Password</h2>
          <p style="color: #64748b; text-align: center; margin-bottom: 24px;">
            Hey ${firstName}, use this code to reset your password:
          </p>
          <div style="background: #fef2f2; border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ef4444;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center;">
            This code expires in 15 minutes. If you didn't request a password reset, ignore this email.
          </p>
        </div>
      </div>
    `;
    await this.send(to, 'Reset Your Roomie Password', html);
  }

  async sendPasswordResetSuccess(to: string, firstName: string): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc;">
        <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; background: #10b981; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: #fff; font-size: 28px;">&#10003;</span>
            </div>
          </div>
          <h2 style="color: #1e293b; text-align: center; margin-bottom: 8px;">Password Reset Successful</h2>
          <p style="color: #64748b; text-align: center;">
            Hey ${firstName}, your password has been reset successfully. You can now log in with your new password.
          </p>
        </div>
      </div>
    `;
    await this.send(to, 'Password Reset Successful - Roomie', html);
  }
}

export default new EmailService();
