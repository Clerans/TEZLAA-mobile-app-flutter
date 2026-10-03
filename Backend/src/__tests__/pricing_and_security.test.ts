import { payHereProvider } from '../services/payhere.provider.js';
import crypto from 'crypto';

describe('Payment & Security Unit Tests', () => {
  it('should generate valid PayHere checkout MD5 hash', () => {
    const orderNumber = 'TZL-2026-001';
    const amount = 1500.0;
    const currency = 'LKR';

    const hash = payHereProvider.generateCheckoutHash(orderNumber, amount, currency);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(32);
    expect(hash).toBe(hash.toUpperCase());
  });

  it('should verify valid PayHere webhook signature', () => {
    const orderId = 'TZL-2026-002';
    const amount = '2450.00';
    const currency = 'LKR';
    const statusCode = '2';

    const signature = payHereProvider.generateNotificationSignature(orderId, amount, currency, statusCode);

    const isValid = payHereProvider.verifyNotificationSignature({
      merchant_id: (payHereProvider as any).merchantId,
      order_id: orderId,
      payhere_amount: amount,
      payhere_currency: currency,
      status_code: statusCode,
      md5sig: signature,
    });

    expect(isValid).toBe(true);
  });

  it('should reject invalid or tampered PayHere webhook signature', () => {
    const isValid = payHereProvider.verifyNotificationSignature({
      merchant_id: (payHereProvider as any).merchantId,
      order_id: 'TZL-FAKE-ORDER',
      payhere_amount: '100.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: 'INVALID_SIGNATURE_HASH_HERE_12345',
    });

    expect(isValid).toBe(false);
  });
});
