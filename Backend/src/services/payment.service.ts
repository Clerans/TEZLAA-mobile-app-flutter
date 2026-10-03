import prisma from '../config/database.js';
import payHereProvider, { PayHereNotificationPayload } from './payhere.provider.js';
import notificationService from './notification.service.js';
import { emitOrderStatusUpdated } from '../sockets/index.js';
import { ApiError } from '../utils/apiError.js';
import { PaymentMethod, PaymentStatus, OrderStatus, ReservationStatus } from '@prisma/client';

export class PaymentService {
  /**
   * Prepares signed PayHere checkout parameters for an order
   */
  async preparePayHereCheckout(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        user: true,
        address: true,
        branch: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new ApiError(403, 'Unauthorized access to order payment');
    }

    // Must be online payment method
    const isOnline = order.payments.some(
      (p) => p.paymentMethod === PaymentMethod.CARD || p.paymentMethod === PaymentMethod.ONLINE_GATEWAY
    );
    if (!isOnline && order.payments.length > 0 && order.payments[0].paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      throw new ApiError(400, 'Cannot initiate online payment for a Cash on Delivery order.');
    }

    // Check if already paid or in terminal state
    const alreadyCompleted = order.payments.some((p) => p.status === PaymentStatus.COMPLETED);
    if (alreadyCompleted || order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY || order.status === OrderStatus.OUT_FOR_DELIVERY || order.status === OrderStatus.DELIVERED || order.status === OrderStatus.READY_FOR_PICKUP || order.status === OrderStatus.PICKED_UP) {
      throw new ApiError(400, 'This order is already confirmed or completed and cannot be paid again.');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ApiError(400, 'This order has been cancelled and cannot accept payment.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ApiError(400, `Cannot initiate payment for order in ${order.status} state.`);
    }

    if (!order.user.email || !order.user.email.trim()) {
      throw new ApiError(400, 'A valid email address on your profile is required for online checkout.');
    }
    if (!order.user.phone || !order.user.phone.trim()) {
      throw new ApiError(400, 'A valid phone number on your profile is required for online checkout.');
    }

    const nameParts = (order.user.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    let customerAddress = '';
    let customerCity = 'Colombo';

    if (order.orderType === 'DELIVERY') {
      if (!order.address || !order.address.addressLine1?.trim()) {
        throw new ApiError(400, 'A valid delivery address is required for online checkout of delivery orders.');
      }
      customerAddress = order.address.addressLine1.trim();
      customerCity = order.address.city?.trim() || 'Colombo';
    } else {
      customerAddress = order.branch?.address?.trim() || 'TEZLAA Flagship Café';
    }

    const itemsSummary = order.items
      .map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`)
      .join(', ')
      .slice(0, 100);

    const checkoutParams = payHereProvider.createCheckoutPayload({
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      currency: 'LKR',
      customer: {
        firstName,
        lastName,
        email: order.user.email,
        phone: order.user.phone,
        address: customerAddress,
        city: customerCity,
        country: 'Sri Lanka',
      },
      itemsSummary,
    });

    return checkoutParams;
  }

  /**
   * Authoritative Server-to-Server PayHere Notification Webhook Handler
   */
  async handlePayHereWebhook(payload: PayHereNotificationPayload) {
    console.log(`[PayHere Webhook] Processing notification for order: ${payload.order_id}, status: ${payload.status_code}`);

    // 1. Verify PayHere MD5 Signature
    const isSignatureValid = payHereProvider.verifyNotificationSignature(payload);
    if (!isSignatureValid) {
      console.error(`[PayHere Webhook] ❌ Invalid MD5 signature for order ${payload.order_id}`);
      throw new ApiError(400, 'Invalid payment signature');
    }

    // 2. Find Order with reservations and payments
    const order = await prisma.order.findUnique({
      where: { orderNumber: payload.order_id },
      include: {
        payments: true,
        user: true,
        loyaltyReservation: true,
        couponReservation: true,
      },
    });

    if (!order) {
      console.error(`[PayHere Webhook] ❌ Order not found for order_id: ${payload.order_id}`);
      throw new ApiError(404, 'Order reference not found');
    }

    const expectedAmount = order.grandTotal.toFixed(2);
    const receivedAmount = parseFloat(payload.payhere_amount).toFixed(2);

    // 3. Amount & Currency Verification
    if (expectedAmount !== receivedAmount) {
      console.error(
        `[PayHere Webhook] ❌ Amount mismatch! Expected: ${expectedAmount}, Received: ${receivedAmount}`
      );
      await prisma.payment.updateMany({
        where: { orderId: order.id },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: JSON.parse(
            JSON.stringify({
              error: 'Amount mismatch',
              expectedAmount,
              receivedAmount,
              payload,
            })
          ),
        },
      });
      throw new ApiError(400, 'Payment amount mismatch');
    }

    if (payload.payhere_currency !== 'LKR') {
      console.error(`[PayHere Webhook] ❌ Currency mismatch! Expected LKR, Received: ${payload.payhere_currency}`);
      throw new ApiError(400, 'Invalid currency');
    }

    // 4. Idempotency Check:
    // If this payment_id has already been processed or order is already COMPLETED/PAID, return idempotent success
    const existingPaymentForTxn = order.payments.find(
      (p) => p.transactionId === payload.payment_id && p.status === PaymentStatus.COMPLETED
    );
    if (existingPaymentForTxn || (order.payments.some((p) => p.status === PaymentStatus.COMPLETED) && payload.status_code === '2')) {
      console.log(`[PayHere Webhook] ℹ️ Payment ${payload.payment_id} for order ${order.orderNumber} is already completed. Skipping duplicates.`);
      return { success: true, status: 'COMPLETED', message: 'Payment already processed', duplicate: true, idempotent: true };
    }

    const statusCode = payload.status_code;

    // 5. Status Mapping & Atomic Database State Machine
    if (statusCode === '2') {
      // SUCCESS (COMPLETED)
      await prisma.$transaction(async (tx) => {
        // Find existing payment or create
        const paymentRecord = order.payments.find((p) => p.paymentMethod === PaymentMethod.CARD) || order.payments[0];

        if (paymentRecord) {
          await tx.payment.update({
            where: { id: paymentRecord.id },
            data: {
              status: PaymentStatus.COMPLETED,
              transactionId: payload.payment_id,
              gatewayProvider: payload.method || 'PayHere',
              gatewayResponse: JSON.parse(JSON.stringify(payload)),
            },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              paymentMethod: PaymentMethod.CARD,
              status: PaymentStatus.COMPLETED,
              amount: order.grandTotal,
              currency: 'LKR',
              transactionId: payload.payment_id,
              gatewayProvider: payload.method || 'PayHere',
              gatewayResponse: JSON.parse(JSON.stringify(payload)),
            },
          });
        }

        // Advance Order to CONFIRMED ONLY if currently in PENDING state (Never regress terminal orders)
        if (order.status === OrderStatus.PENDING) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.CONFIRMED,
            },
          });

          // Commit Coupon Reservation
          if (order.couponReservation && order.couponReservation.status === ReservationStatus.RESERVED) {
            await tx.couponReservation.update({
              where: { id: order.couponReservation.id },
              data: {
                status: ReservationStatus.CONSUMED,
                consumedAt: new Date(),
              },
            });

            await tx.coupon.update({
              where: { id: order.couponReservation.couponId },
              data: {
                usageCount: { increment: 1 },
              },
            });
          } else if (order.couponCode) {
            await tx.coupon.updateMany({
              where: { code: order.couponCode },
              data: {
                usageCount: { increment: 1 },
              },
            });
          }

          // Commit Loyalty Reservation
          if (order.loyaltyReservation && order.loyaltyReservation.status === ReservationStatus.RESERVED) {
            await tx.loyaltyReservation.update({
              where: { id: order.loyaltyReservation.id },
              data: {
                status: ReservationStatus.CONSUMED,
                consumedAt: new Date(),
              },
            });

            const account = await tx.loyaltyAccount.findUnique({
              where: { userId: order.userId },
            });

            if (account) {
              const pointsToDeduct = order.loyaltyReservation.points;
              await tx.loyaltyAccount.update({
                where: { id: account.id },
                data: {
                  points: { decrement: pointsToDeduct },
                },
              });

              await tx.loyaltyTransaction.create({
                data: {
                  loyaltyAccountId: account.id,
                  orderId: order.id,
                  points: -pointsToDeduct,
                  type: 'REDEEMED',
                  description: `Redeemed for Order #${order.orderNumber}`,
                },
              });
            }
          }
        }
      }, { timeout: 20000, maxWait: 10000 });

      console.log(`[PayHere Webhook] ✅ Order ${order.orderNumber} successfully marked as PAID and CONFIRMED.`);

      // Notify Customer
      await notificationService.createOrderStatusNotification(
        order.userId,
        order.orderNumber,
        'CONFIRMED',
        order.id
      );

      // Emit Real-Time Order Event via Socket.IO
      emitOrderStatusUpdated(order.id, order.userId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
        updatedAt: new Date(),
      });

      return { success: true, status: 'COMPLETED', message: 'Payment successfully completed' };
    } else if (statusCode === '-1') {
      // CANCELLED
      await prisma.$transaction(async (tx) => {
        const paymentRecord = order.payments.find((p) => p.paymentMethod === PaymentMethod.CARD) || order.payments[0];
        if (paymentRecord) {
          await tx.payment.update({
            where: { id: paymentRecord.id },
            data: {
              status: PaymentStatus.CANCELLED,
              transactionId: payload.payment_id || paymentRecord.transactionId,
              gatewayProvider: payload.method || 'PayHere',
              gatewayResponse: JSON.parse(JSON.stringify(payload)),
            },
          });
        }

        // If order is still PENDING, mark CANCELLED & release reservations
        if (order.status === OrderStatus.PENDING) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED },
          });

          if (order.couponReservation && order.couponReservation.status === ReservationStatus.RESERVED) {
            await tx.couponReservation.update({
              where: { id: order.couponReservation.id },
              data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
            });
          }

          if (order.loyaltyReservation && order.loyaltyReservation.status === ReservationStatus.RESERVED) {
            await tx.loyaltyReservation.update({
              where: { id: order.loyaltyReservation.id },
              data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
            });
          }
        }
      }, { timeout: 20000, maxWait: 10000 });

      emitOrderStatusUpdated(order.id, order.userId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
        updatedAt: new Date(),
      });

      return { success: false, status: 'CANCELLED', message: 'Payment cancelled by user' };
    } else {
      // FAILED / CHARGEBACK (-2, -3, etc.)
      await prisma.$transaction(async (tx) => {
        const paymentRecord = order.payments.find((p) => p.paymentMethod === PaymentMethod.CARD) || order.payments[0];
        if (paymentRecord) {
          await tx.payment.update({
            where: { id: paymentRecord.id },
            data: {
              status: PaymentStatus.FAILED,
              transactionId: payload.payment_id || paymentRecord.transactionId,
              gatewayProvider: payload.method || 'PayHere',
              gatewayResponse: JSON.parse(JSON.stringify(payload)),
            },
          });
        }

        // Release reservations if still reserved
        if (order.couponReservation && order.couponReservation.status === ReservationStatus.RESERVED) {
          await tx.couponReservation.update({
            where: { id: order.couponReservation.id },
            data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
          });
        }

        if (order.loyaltyReservation && order.loyaltyReservation.status === ReservationStatus.RESERVED) {
          await tx.loyaltyReservation.update({
            where: { id: order.loyaltyReservation.id },
            data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
          });
        }
      }, { timeout: 20000, maxWait: 10000 });

      console.warn(`[PayHere Webhook] ⚠️ Order ${order.orderNumber} payment marked as FAILED`);

      emitOrderStatusUpdated(order.id, order.userId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: PaymentStatus.FAILED,
        updatedAt: new Date(),
      });

      return { success: false, status: 'FAILED', message: `Payment failed with status code ${statusCode}` };
    }
  }

  /**
   * Get current payment status for an order
   */
  async getPaymentStatus(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        payments: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new ApiError(403, 'Unauthorized access to order');
    }

    const payment = order.payments[0] || null;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: payment?.status || PaymentStatus.PENDING,
      paymentMethod: payment?.paymentMethod || order.payments[0]?.paymentMethod || 'CARD',
      transactionId: payment?.transactionId || null,
      amount: order.grandTotal,
      currency: payment?.currency || 'LKR',
      updatedAt: payment?.updatedAt || order.updatedAt,
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;

