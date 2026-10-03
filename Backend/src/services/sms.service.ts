import { env } from '../config/env.js';

export interface ISmsProvider {
  sendSms(phoneNumber: string, message: string): Promise<boolean>;
}

export class MockSmsProvider implements ISmsProvider {
  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    console.log(`📱 [MOCK SMS] To: ${phoneNumber} | Sender: ${env.SMS_SENDER_ID} | Message: "${message}"`);
    return true;
  }
}

export class SmsService {
  private provider: ISmsProvider;

  constructor(provider?: ISmsProvider) {
    // Pluggable provider architecture
    this.provider = provider || new MockSmsProvider();
  }

  setProvider(provider: ISmsProvider) {
    this.provider = provider;
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const message = `Your TEZLAA Artisan Café verification code is ${otp}. Valid for 10 minutes.`;
    return this.provider.sendSms(phoneNumber, message);
  }

  async sendOrderUpdate(phoneNumber: string, orderNumber: string, status: string): Promise<boolean> {
    const message = `TEZLAA Order #${orderNumber} is now: ${status}. Thank you for choosing TEZLAA.`;
    return this.provider.sendSms(phoneNumber, message);
  }
}

export const smsService = new SmsService();
