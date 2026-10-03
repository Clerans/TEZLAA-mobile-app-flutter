import { jest } from '@jest/globals';
import { payHereProvider } from '../services/payhere.provider.js';
import { paymentService } from '../services/payment.service.js';
import notificationService from '../services/notification.service.js';
import prisma from '../config/database.js';
import { PaymentStatus, OrderStatus, ReservationStatus } from '@prisma/client';

describe('PayHere Status Code State Machine (2, 0, -1, -2, -3)', () => {
  const testOrderId = 'TZL-TEST-ORD-01';
  const testGrandTotal = 2500.0;
  const merchantId = (payHereProvider as any).merchantId || 'TEST_MERCHANT_ID';

  const createMockOrder = (status: OrderStatus = OrderStatus.PENDING) => ({
    id: 'uuid-order-1',
    orderNumber: testOrderId,
    userId: 'uuid-user-1',
    branchId: 'uuid-branch-1',
    grandTotal: testGrandTotal,
    status,
    payments: [
      {
        id: 'uuid-payment-1',
        orderId: 'uuid-order-1',
        paymentMethod: 'CARD',
        status: PaymentStatus.PENDING,
        amount: testGrandTotal,
        currency: 'LKR',
        transactionId: null,
      },
    ],
    couponReservation: {
      id: 'uuid-coupon-res-1',
      couponId: 'uuid-coupon-1',
      status: ReservationStatus.RESERVED,
    },
    loyaltyReservation: {
      id: 'uuid-loyalty-res-1',
      status: ReservationStatus.RESERVED,
      points: 100,
    },
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Status 2 (COMPLETED): should mark payment COMPLETED and order CONFIRMED, consuming reservations', async () => {
    const mockOrder = createMockOrder();
    const signature = payHereProvider.generateNotificationSignature(
      testOrderId,
      testGrandTotal.toFixed(2),
      'LKR',
      '2'
    );

    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
    const mockTx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      order: { update: jest.fn().mockResolvedValue({}) },
      couponReservation: { update: jest.fn().mockResolvedValue({}) },
      coupon: { update: jest.fn().mockResolvedValue({}) },
      loyaltyReservation: { update: jest.fn().mockResolvedValue({}) },
      loyaltyAccount: { findUnique: jest.fn().mockResolvedValue({ id: 'acc-1' }), update: jest.fn().mockResolvedValue({}) },
      loyaltyTransaction: { create: jest.fn().mockResolvedValue({}) },
    };
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await paymentService.handlePayHereWebhook({
      merchant_id: merchantId,
      order_id: testOrderId,
      payment_id: 'PAYHERE_TXN_002',
      payhere_amount: testGrandTotal.toFixed(2),
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: signature,
      method: 'VISA',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.COMPLETED }),
      })
    );
    expect(mockTx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.CONFIRMED }),
      })
    );
  });

  it('Status 0 (PENDING): should mark payment PENDING and retain reservations without cancelling order', async () => {
    const mockOrder = createMockOrder();
    const signature = payHereProvider.generateNotificationSignature(
      testOrderId,
      testGrandTotal.toFixed(2),
      'LKR',
      '0'
    );

    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
    const mockTx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      order: { update: jest.fn().mockResolvedValue({}) },
      couponReservation: { update: jest.fn().mockResolvedValue({}) },
      loyaltyReservation: { update: jest.fn().mockResolvedValue({}) },
    };
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await paymentService.handlePayHereWebhook({
      merchant_id: merchantId,
      order_id: testOrderId,
      payment_id: 'PAYHERE_TXN_000',
      payhere_amount: testGrandTotal.toFixed(2),
      payhere_currency: 'LKR',
      status_code: '0',
      md5sig: signature,
      method: 'BANK_ASYNC',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('PENDING');
    // Crucial: payment is updated to PENDING
    expect(mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.PENDING }),
      })
    );
    // Crucial: order must NOT be cancelled or confirmed, reservations must NOT be released
    expect(mockTx.order.update).not.toHaveBeenCalled();
    expect(mockTx.couponReservation.update).not.toHaveBeenCalled();
    expect(mockTx.loyaltyReservation.update).not.toHaveBeenCalled();
  });

  it('Status -1 (CANCELLED): should mark payment CANCELLED, cancel PENDING order, and release reservations', async () => {
    const mockOrder = createMockOrder();
    const signature = payHereProvider.generateNotificationSignature(
      testOrderId,
      testGrandTotal.toFixed(2),
      'LKR',
      '-1'
    );

    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
    const mockTx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      order: { update: jest.fn().mockResolvedValue({}) },
      couponReservation: { update: jest.fn().mockResolvedValue({}) },
      loyaltyReservation: { update: jest.fn().mockResolvedValue({}) },
    };
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await paymentService.handlePayHereWebhook({
      merchant_id: merchantId,
      order_id: testOrderId,
      payment_id: 'PAYHERE_TXN_CANCELLED',
      payhere_amount: testGrandTotal.toFixed(2),
      payhere_currency: 'LKR',
      status_code: '-1',
      md5sig: signature,
      method: 'VISA',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('CANCELLED');
    expect(mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.CANCELLED }),
      })
    );
    expect(mockTx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.CANCELLED }),
      })
    );
    expect(mockTx.couponReservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ReservationStatus.RELEASED }),
      })
    );
    expect(mockTx.loyaltyReservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ReservationStatus.RELEASED }),
      })
    );
  });

  it('Status -2 (FAILED): should mark payment FAILED and release reservations', async () => {
    const mockOrder = createMockOrder();
    const signature = payHereProvider.generateNotificationSignature(
      testOrderId,
      testGrandTotal.toFixed(2),
      'LKR',
      '-2'
    );

    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
    const mockTx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      couponReservation: { update: jest.fn().mockResolvedValue({}) },
      loyaltyReservation: { update: jest.fn().mockResolvedValue({}) },
    };
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await paymentService.handlePayHereWebhook({
      merchant_id: merchantId,
      order_id: testOrderId,
      payment_id: 'PAYHERE_TXN_FAILED',
      payhere_amount: testGrandTotal.toFixed(2),
      payhere_currency: 'LKR',
      status_code: '-2',
      md5sig: signature,
      method: 'MASTERCARD',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      })
    );
    expect(mockTx.couponReservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ReservationStatus.RELEASED }),
      })
    );
    expect(mockTx.loyaltyReservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ReservationStatus.RELEASED }),
      })
    );
  });

  it('Status -3 (CHARGEBACK): should mark payment REFUNDED, record dispute audit, and reverse loyalty points', async () => {
    const mockOrder = createMockOrder(OrderStatus.CONFIRMED);
    mockOrder.loyaltyReservation.status = ReservationStatus.CONSUMED;
    const signature = payHereProvider.generateNotificationSignature(
      testOrderId,
      testGrandTotal.toFixed(2),
      'LKR',
      '-3'
    );

    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
    const mockTx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      loyaltyAccount: { findUnique: jest.fn().mockResolvedValue({ id: 'acc-1' }), update: jest.fn().mockResolvedValue({}) },
      loyaltyTransaction: { create: jest.fn().mockResolvedValue({}) },
    };
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await paymentService.handlePayHereWebhook({
      merchant_id: merchantId,
      order_id: testOrderId,
      payment_id: 'PAYHERE_TXN_CHARGEBACK',
      payhere_amount: testGrandTotal.toFixed(2),
      payhere_currency: 'LKR',
      status_code: '-3',
      md5sig: signature,
      method: 'VISA',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('CHARGEBACK');
    expect(mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PaymentStatus.REFUNDED,
          gatewayResponse: expect.objectContaining({ chargeback: true, flaggedForReconciliation: true }),
        }),
      })
    );
    // Verified loyalty points reversal
    expect(mockTx.loyaltyAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ points: { increment: 100 } }),
      })
    );
  });
});
