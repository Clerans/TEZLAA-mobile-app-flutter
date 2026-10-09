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
    const htmlContent = `
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
    `;

    // 1. Prioritize Brevo HTTPS API (Works seamlessly on Render where SMTP ports are blocked)
    if (env.BREVO_API_KEY) {
      try {
        const senderMatch = env.EMAIL_FROM.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
        const rawSenderName = env.BREVO_SENDER_NAME || senderMatch?.[1] || 'TEZLAA Artisan Café';
        const senderName = rawSenderName.replace(/<[^>]+>/g, '').trim() || 'TEZLAA Artisan Café';
        const senderEmail = env.BREVO_SENDER_EMAIL || senderMatch?.[2] || 'cleranspc@gmail.com';

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: to }],
            subject: 'Your TEZLAA Verification Code',
            htmlContent,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { messageId?: string };
          console.log(`📧 [BREVO DELIVERED] Real OTP sent to ${to} | MessageId: ${data.messageId}`);
          return true;
        } else {
          const errText = await res.text();
          console.error(`❌ Brevo API error (${res.status}):`, errText);
        }
      } catch (err) {
        console.error('❌ Failed to send email via Brevo API:', err);
      }
    }

    // 2. Fallback to Nodemailer SMTP
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to,
          subject: 'Your TEZLAA Verification Code',
          html: htmlContent,
        });
        console.log(`📧 [SMTP DELIVERED] Real OTP sent to ${to} | MessageId: ${info.messageId}`);
        return true;
      } catch (error) {
        console.error('❌ Failed to send email via SMTP:', error);
        return false;
      }
    }

    // 3. Fallback to mock log
    console.log(`✉️  [MOCK EMAIL] To: ${to} | Subject: TEZLAA Verification Code | OTP: ${otp}`);
    return true;
  }
}

export const emailService = new EmailService();
