import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_USER && env.SMTP_PASS && env.SMTP_PASS !== 'mock_pass') {
      const cleanPass = env.SMTP_PASS.replace(/\s+/g, '');
      if (env.SMTP_HOST?.includes('gmail') || env.SMTP_USER.includes('@gmail.com')) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: env.SMTP_USER,
            pass: cleanPass,
          },
        });
      } else if (env.SMTP_HOST) {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT) || 587,
          secure: Number(env.SMTP_PORT) === 465,
          auth: {
            user: env.SMTP_USER,
            pass: cleanPass,
          },
        });
      }
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    if (!this.transporter) {
      console.log(`✉️  [MOCK EMAIL] To: ${to} | Subject: TEZLAA Verification Code | OTP: ${otp}`);
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject: 'Your TEZLAA Verification Code',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #F25C27; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">TEZLAA</h2>
              <p style="color: #6B7280; margin: 4px 0 0 0; font-size: 13px;">Artisan Café & Bakery</p>
            </div>
            <p style="color: #1F2937; font-size: 15px; line-height: 1.5;">Hello,</p>
            <p style="color: #1F2937; font-size: 15px; line-height: 1.5;">Use the following 6-digit code to verify your account or reset your password. This code expires in 10 minutes.</p>
            <div style="background-color: #F9FAFB; border: 1px dashed #F25C27; border-radius: 8px; text-align: center; padding: 16px; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 700; color: #F25C27; letter-spacing: 6px;">${otp}</span>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; text-align: center;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`📧 [EMAIL DELIVERED] Real OTP sent to ${to} | MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via SMTP:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
