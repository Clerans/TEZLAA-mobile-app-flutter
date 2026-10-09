import prisma from '../config/database.js';
import { Coupon, CouponReservation, ReservationStatus } from '@prisma/client';

export class CouponRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    const now = new Date();
    return prisma.coupon.findFirst({
      where: {
        code: { equals: code.trim(), mode: 'insensitive' },
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });
  }

  async getActiveReservationsCount(couponId: string): Promise<number> {
    return prisma.couponReservation.count({
      where: {
        couponId,
        status: ReservationStatus.RESERVED,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async incrementUsage(id: string): Promise<Coupon> {
    return prisma.coupon.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }

  async createReservation(data: {
    userId: string;
    orderId: string;
    couponId: string;
    couponCode: string;
    expiresAt?: Date;
  }): Promise<CouponReservation> {
    return prisma.couponReservation.create({
      data: {
        userId: data.userId,
        orderId: data.orderId,
        couponId: data.couponId,
        couponCode: data.couponCode,
        status: ReservationStatus.RESERVED,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 60 * 1000), // 30 min reservation window
      },
    });
  }

  async commitReservation(orderId: string): Promise<CouponReservation | null> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.couponReservation.findUnique({
        where: { orderId },
      });

      if (!reservation || reservation.status !== ReservationStatus.RESERVED) {
        return reservation;
      }

      const updated = await tx.couponReservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CONSUMED,
          consumedAt: new Date(),
        },
      });

      await tx.coupon.update({
        where: { id: reservation.couponId },
        data: {
          usageCount: { increment: 1 },
        },
      });

      return updated;
    }, { timeout: 20000, maxWait: 10000 });
  }

  async releaseReservation(orderId: string): Promise<CouponReservation | null> {
    const reservation = await prisma.couponReservation.findUnique({
      where: { orderId },
    });

    if (!reservation || reservation.status !== ReservationStatus.RESERVED) {
      return reservation;
    }

    return prisma.couponReservation.update({
      where: { id: reservation.id },
      data: {
        status: ReservationStatus.RELEASED,
        releasedAt: new Date(),
      },
    });
  }
}

export const couponRepository = new CouponRepository();
export default couponRepository;

