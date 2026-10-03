import prisma from '../config/database.js';
import { LoyaltyAccount, LoyaltyTier, LoyaltyTransaction, LoyaltyTxType, Reward, LoyaltyReservation, ReservationStatus } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';

export class LoyaltyRepository {
  async findOrCreateAccount(userId: string): Promise<LoyaltyAccount> {
    try {
      return await prisma.loyaltyAccount.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          points: 0,
          lifetimePoints: 0,
          tier: LoyaltyTier.BRONZE,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        const existing = await prisma.loyaltyAccount.findUnique({ where: { userId } });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async getAccountByUserId(userId: string): Promise<LoyaltyAccount | null> {
    return prisma.loyaltyAccount.findUnique({
      where: { userId },
    });
  }

  async getActiveReservationsPoints(userId: string): Promise<number> {
    const reservations = await prisma.loyaltyReservation.findMany({
      where: {
        userId,
        status: ReservationStatus.RESERVED,
        expiresAt: { gt: new Date() },
      },
      select: { points: true },
    });

    return reservations.reduce((sum, r) => sum + r.points, 0);
  }

  async getTransactionsByUserId(
    userId: string,
    limit = 30,
    page = 1
  ): Promise<{ transactions: LoyaltyTransaction[]; total: number }> {
    const account = await this.findOrCreateAccount(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { loyaltyAccountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          order: {
            select: {
              orderNumber: true,
              grandTotal: true,
            },
          },
        },
      }),
      prisma.loyaltyTransaction.count({
        where: { loyaltyAccountId: account.id },
      }),
    ]);

    return { transactions, total };
  }

  async getActiveRewards(): Promise<Reward[]> {
    return prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsRequired: 'asc' },
    });
  }

  async getRewardById(rewardId: string): Promise<Reward | null> {
    return prisma.reward.findUnique({
      where: { id: rewardId },
    });
  }

  async createReservation(data: {
    userId: string;
    orderId: string;
    rewardId: string;
    points: number;
    expiresAt?: Date;
  }): Promise<LoyaltyReservation> {
    return prisma.loyaltyReservation.create({
      data: {
        userId: data.userId,
        orderId: data.orderId,
        rewardId: data.rewardId,
        points: data.points,
        status: ReservationStatus.RESERVED,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  }

  async commitReservation(orderId: string): Promise<LoyaltyReservation | null> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.loyaltyReservation.findUnique({
        where: { orderId },
      });

      if (!reservation || reservation.status !== ReservationStatus.RESERVED) {
        return reservation;
      }

      const account = await tx.loyaltyAccount.findUnique({
        where: { userId: reservation.userId },
      });

      if (account) {
        await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            points: { decrement: reservation.points },
          },
        });

        await tx.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            orderId,
            points: -reservation.points,
            type: LoyaltyTxType.REDEEMED,
            description: `Redeemed reward for Order`,
          },
        });
      }

      return tx.loyaltyReservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CONSUMED,
          consumedAt: new Date(),
        },
      });
    });
  }

  async releaseReservation(orderId: string): Promise<LoyaltyReservation | null> {
    const reservation = await prisma.loyaltyReservation.findUnique({
      where: { orderId },
    });

    if (!reservation || reservation.status !== ReservationStatus.RESERVED) {
      return reservation;
    }

    return prisma.loyaltyReservation.update({
      where: { id: reservation.id },
      data: {
        status: ReservationStatus.RELEASED,
        releasedAt: new Date(),
      },
    });
  }

  async hasOrderAwardedPoints(orderId: string): Promise<boolean> {
    const existing = await prisma.loyaltyAward.findUnique({
      where: { orderId },
    });
    return Boolean(existing);
  }

  // Atomic award points on completed order with database-level unique award constraint
  async awardOrderPoints(
    userId: string,
    orderId: string,
    points: number,
    description: string,
    newTier?: LoyaltyTier
  ): Promise<{ account: LoyaltyAccount; transaction?: LoyaltyTransaction }> {
    const account = await this.findOrCreateAccount(userId);

    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Database-level unique constraint via LoyaltyAward
        const existingAward = await tx.loyaltyAward.findUnique({
          where: { orderId },
        });

        if (existingAward) {
          return { account };
        }

        await tx.loyaltyAward.create({
          data: {
            orderId,
            userId,
            points,
          },
        });

        const updatedAccount = await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            points: { increment: points },
            lifetimePoints: { increment: points },
            ...(newTier && { tier: newTier }),
          },
        });

        const transaction = await tx.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            orderId,
            points,
            type: LoyaltyTxType.EARNED,
            description,
          },
        });

        return { account: updatedAccount, transaction };
      }, { timeout: 20000, maxWait: 10000 });
    } catch (err: any) {
      if (err.code === 'P2002') {
        const currentAccount = await this.getAccountByUserId(userId);
        return { account: currentAccount || account };
      }
      throw err;
    }
  }

  // Atomic reward redemption preventing concurrent double-spend
  async redeemRewardTransaction(
    userId: string,
    reward: Reward
  ): Promise<{ account: LoyaltyAccount; transaction: LoyaltyTransaction }> {
    return prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new ApiError(400, 'Loyalty account not found');
      }

      const activeReserved = await tx.loyaltyReservation.findMany({
        where: {
          userId,
          status: ReservationStatus.RESERVED,
        },
        select: { points: true },
      });
      const reservedSum = activeReserved.reduce((s, r) => s + r.points, 0);
      const availablePoints = account.points - reservedSum;

      if (availablePoints < reward.pointsRequired) {
        throw new ApiError(400, 'Insufficient available loyalty points to redeem this reward');
      }

      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { decrement: reward.pointsRequired },
        },
      });

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          points: -reward.pointsRequired,
          type: LoyaltyTxType.REDEEMED,
          description: `Redeemed ${reward.title}`,
        },
      });

      return { account: updatedAccount, transaction };
    });
  }
}

export const loyaltyRepository = new LoyaltyRepository();
export default loyaltyRepository;

