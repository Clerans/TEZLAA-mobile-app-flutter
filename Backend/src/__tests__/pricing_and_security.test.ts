import { payHereProvider } from '../services/payhere.provider.js';
import { VALID_DELIVERY_TRANSITIONS, VALID_PICKUP_TRANSITIONS } from '../services/order.service.js';
import { OrderStatus } from '@prisma/client';

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

describe('KDS Order State Machine Transition Matrix Tests', () => {
  describe('DELIVERY Order Transitions', () => {
    it('should allow linear delivery progression', () => {
      expect(VALID_DELIVERY_TRANSITIONS.PENDING).toContain(OrderStatus.CONFIRMED);
      expect(VALID_DELIVERY_TRANSITIONS.CONFIRMED).toContain(OrderStatus.PREPARING);
      expect(VALID_DELIVERY_TRANSITIONS.PREPARING).toContain(OrderStatus.READY);
      expect(VALID_DELIVERY_TRANSITIONS.READY).toContain(OrderStatus.OUT_FOR_DELIVERY);
      expect(VALID_DELIVERY_TRANSITIONS.OUT_FOR_DELIVERY).toContain(OrderStatus.DELIVERED);
    });

    it('should prohibit terminal state transitions and backward moves', () => {
      expect(VALID_DELIVERY_TRANSITIONS.DELIVERED).toHaveLength(0);
      expect(VALID_DELIVERY_TRANSITIONS.CANCELLED).toHaveLength(0);
      expect(VALID_DELIVERY_TRANSITIONS.OUT_FOR_DELIVERY).not.toContain(OrderStatus.PREPARING);
      expect(VALID_DELIVERY_TRANSITIONS.PENDING).not.toContain(OrderStatus.DELIVERED);
    });

    it('should not allow pickup states in delivery workflow', () => {
      expect(VALID_DELIVERY_TRANSITIONS.READY).not.toContain(OrderStatus.READY_FOR_PICKUP);
      expect(VALID_DELIVERY_TRANSITIONS.READY).not.toContain(OrderStatus.PICKED_UP);
    });
  });

  describe('PICKUP Order Transitions', () => {
    it('should allow pickup progression (READY -> READY_FOR_PICKUP -> PICKED_UP or direct READY -> PICKED_UP)', () => {
      expect(VALID_PICKUP_TRANSITIONS.PENDING).toContain(OrderStatus.CONFIRMED);
      expect(VALID_PICKUP_TRANSITIONS.CONFIRMED).toContain(OrderStatus.PREPARING);
      expect(VALID_PICKUP_TRANSITIONS.PREPARING).toContain(OrderStatus.READY);
      expect(VALID_PICKUP_TRANSITIONS.READY).toContain(OrderStatus.READY_FOR_PICKUP);
      expect(VALID_PICKUP_TRANSITIONS.READY).toContain(OrderStatus.PICKED_UP);
      expect(VALID_PICKUP_TRANSITIONS.READY_FOR_PICKUP).toContain(OrderStatus.PICKED_UP);
    });

    it('should forbid delivery states (OUT_FOR_DELIVERY, DELIVERED) in pickup workflow', () => {
      expect(VALID_PICKUP_TRANSITIONS.READY).not.toContain(OrderStatus.OUT_FOR_DELIVERY);
      expect(VALID_PICKUP_TRANSITIONS.READY).not.toContain(OrderStatus.DELIVERED);
      expect(VALID_PICKUP_TRANSITIONS.READY_FOR_PICKUP).not.toContain(OrderStatus.DELIVERED);
      expect(VALID_PICKUP_TRANSITIONS.PICKED_UP).toHaveLength(0);
    });
  });
});
