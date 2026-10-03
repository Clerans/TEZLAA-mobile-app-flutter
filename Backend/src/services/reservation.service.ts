import prisma from '../config/database.js';
import { ReservationStatus, OrderStatus, PaymentStatus } from '@prisma/client';

export class ReservationService {
  /**
   * Expire stale coupon and loyalty reservations older than their expiresAt window
   * and mark abandoned unpaid orders as CANCELLED.
   */
  async expireStaleReservations(): Promise<{ expiredCoupons: number; expiredLoyalty: number }> {
    const now = new Date();

    // 1. Expire stale coupon reservations
    const staleCoupons = await prisma.couponReservation.findMany({
      where: {
        status: ReservationStatus.RESERVED,
        expiresAt: { lt: now },
      },
      include: {
        order: {
          include: { payments: true },
        },
      },
    });

    let expiredCoupons = 0;
    for (const res of staleCoupons) {
      await prisma.$transaction(async (tx) => {
        await tx.couponReservation.update({
          where: { id: res.id },
          data: { status: ReservationStatus.EXPIRED, releasedAt: now },
        });

        // If order is still pending and unpaid, cancel it
        if (res.order && res.order.status === OrderStatus.PENDING) {
          const isPaid = res.order.payments.some((p) => p.status === PaymentStatus.COMPLETED);
          if (!isPaid) {
            await tx.order.update({
              where: { id: res.order.id },
              data: { status: OrderStatus.CANCELLED },
            });
          }
        }
      });
      expiredCoupons++;
    }

    // 2. Expire stale loyalty reservations
    const staleLoyalty = await prisma.loyaltyReservation.findMany({
      where: {
        status: ReservationStatus.RESERVED,
        expiresAt: { lt: now },
      },
      include: {
        order: {
          include: { payments: true },
        },
      },
    });

    let expiredLoyalty = 0;
    for (const res of staleLoyalty) {
      await prisma.$transaction(async (tx) => {
        await tx.loyaltyReservation.update({
          where: { id: res.id },
          data: { status: ReservationStatus.EXPIRED, releasedAt: now },
        });

        if (res.order && res.order.status === OrderStatus.PENDING) {
          const isPaid = res.order.payments.some((p) => p.status === PaymentStatus.COMPLETED);
          if (!isPaid) {
            await tx.order.update({
              where: { id: res.order.id },
              data: { status: OrderStatus.CANCELLED },
            });
          }
        }
      });
      expiredLoyalty++;
    }

    if (expiredCoupons > 0 || expiredLoyalty > 0) {
      console.log(`[Reservation Cleanup] 🧹 Expired ${expiredCoupons} coupon reservations and ${expiredLoyalty} loyalty reservations.`);
    }

    return { expiredCoupons, expiredLoyalty };
  }
}

export default new ReservationService();
