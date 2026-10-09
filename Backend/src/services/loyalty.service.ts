import loyaltyRepository from '../repositories/loyalty.repository.js';
import notificationService from './notification.service.js';
import { emitNotification } from '../sockets/index.js';
import { ApiError } from '../utils/apiError.js';
import { LoyaltyTier, NotificationType, Order } from '@prisma/client';

export interface TierInfo {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  progressPercentage: number;
  earnMultiplier: number;
  privileges: string[];
}

export class LoyaltyService {
  // Authoritative Tier Definitions
  private readonly TIER_THRESHOLDS = {
    [LoyaltyTier.BRONZE]: { minPoints: 0, earnRate: 0.10, next: LoyaltyTier.SILVER, target: 500 },
    [LoyaltyTier.SILVER]: { minPoints: 500, earnRate: 0.12, next: LoyaltyTier.GOLD, target: 1500 },
    [LoyaltyTier.GOLD]: { minPoints: 1500, earnRate: 0.15, next: LoyaltyTier.PLATINUM, target: 3500 },
    [LoyaltyTier.PLATINUM]: { minPoints: 3500, earnRate: 0.20, next: null, target: 3500 },
  };

  private readonly TIER_PRIVILEGES = {
    [LoyaltyTier.BRONZE]: [
      'Earn 10 points per Rs. 100 spent',
      'Exclusive member-only seasonal notifications',
    ],
    [LoyaltyTier.SILVER]: [
      'Earn 12 points per Rs. 100 spent',
      'Birthday Month Complimentary Pastry',
      'Early access to Single Origin limited roasts',
    ],
    [LoyaltyTier.GOLD]: [
      'Earn 15 points per Rs. 100 spent',
      'Birthday Month Complimentary Coffee & Pastry',
      'Priority barista preparation on all orders',
      'Invitations to Private Cupping & Tasting Sessions',
    ],
    [LoyaltyTier.PLATINUM]: [
      'Earn 20 points per Rs. 100 spent',
      'Free Artisan Cold Brew with every 5th order',
      'VIP Concierge Support & Priority Delivery',
      'Complimentary Annual TEZLAA Reserve Coffee Box',
    ],
  };

  calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= 3500) return LoyaltyTier.PLATINUM;
    if (lifetimePoints >= 1500) return LoyaltyTier.GOLD;
    if (lifetimePoints >= 500) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }

  getTierProgress(tier: LoyaltyTier, lifetimePoints: number): TierInfo {
    const config = this.TIER_THRESHOLDS[tier];
    let pointsToNextTier = 0;
    let progressPercentage = 100;

    if (config.next) {
      const currentTierFloor = config.minPoints;
      const nextTierTarget = config.target;
      const pointsInCurrentTier = Math.max(0, lifetimePoints - currentTierFloor);
      const tierRange = nextTierTarget - currentTierFloor;

      pointsToNextTier = Math.max(0, nextTierTarget - lifetimePoints);
      progressPercentage = Math.min(100, Math.round((pointsInCurrentTier / tierRange) * 100));
    }

    return {
      currentTier: tier,
      nextTier: config.next,
      pointsToNextTier,
      progressPercentage,
      earnMultiplier: config.earnRate,
      privileges: this.TIER_PRIVILEGES[tier],
    };
  }

  async getAccountDetails(userId: string) {
    const account = await loyaltyRepository.findOrCreateAccount(userId);
    const activeReservedPoints = await loyaltyRepository.getActiveReservationsPoints(userId);
    const availablePoints = Math.max(0, account.points - activeReservedPoints);
    const tierInfo = this.getTierProgress(account.tier, account.lifetimePoints);

    return {
      id: account.id,
      userId: account.userId,
      points: account.points,
      availablePoints,
      reservedPoints: activeReservedPoints,
      lifetimePoints: account.lifetimePoints,
      tier: account.tier,
      tierProgress: tierInfo,
      joinedAt: account.joinedAt,
    };
  }

  async getAvailableRewards(userId: string) {
    const account = await loyaltyRepository.findOrCreateAccount(userId);
    const activeReservedPoints = await loyaltyRepository.getActiveReservationsPoints(userId);
    const availablePoints = Math.max(0, account.points - activeReservedPoints);
    const rewards = await loyaltyRepository.getActiveRewards();

    return rewards.map((reward) => ({
      ...reward,
      isEligible: availablePoints >= reward.pointsRequired,
      pointsNeeded: Math.max(0, reward.pointsRequired - availablePoints),
    }));
  }

  async reserveReward(userId: string, orderId: string, rewardId: string, points: number) {
    return loyaltyRepository.createReservation({
      userId,
      orderId,
      rewardId,
      points,
    });
  }

  async commitReward(orderId: string) {
    return loyaltyRepository.commitReservation(orderId);
  }

  async releaseReward(orderId: string) {
    return loyaltyRepository.releaseReservation(orderId);
  }

  async redeemReward(userId: string, rewardId: string) {
    const reward = await loyaltyRepository.getRewardById(rewardId);
    if (!reward || !reward.isActive) {
      throw new ApiError(404, 'Reward not found or currently inactive');
    }

    const { account, transaction } = await loyaltyRepository.redeemRewardTransaction(userId, reward);

    // Create Notification
    await notificationService.createNotification({
      userId,
      title: 'Reward Redeemed! 🎉',
      message: `You have successfully redeemed ${reward.title} for ${reward.pointsRequired} points.`,
      type: NotificationType.LOYALTY,
      metadata: { rewardId: reward.id, rewardTitle: reward.title, points: reward.pointsRequired },
    });

    return {
      success: true,
      message: `Successfully redeemed ${reward.title}`,
      remainingPoints: account.points,
      transactionId: transaction.id,
      reward,
    };
  }

  async awardPointsForOrder(order: Order) {
    // 1. Check idempotency: ensure order hasn't already received points
    const alreadyAwarded = await loyaltyRepository.hasOrderAwardedPoints(order.id);
    if (alreadyAwarded) {
      return null;
    }

    const account = await loyaltyRepository.findOrCreateAccount(order.userId);
    const tierConfig = this.TIER_THRESHOLDS[account.tier];

    // Earn rate based on subtotal (spent on food/beverages, excluding delivery fee)
    const pointsEarned = Math.round(order.subtotal * tierConfig.earnRate);
    if (pointsEarned <= 0) return null;

    const newLifetimePoints = account.lifetimePoints + pointsEarned;
    const newTier = this.calculateTier(newLifetimePoints);
    const isTierUpgraded = newTier !== account.tier;

    const { account: updatedAccount, transaction } = await loyaltyRepository.awardOrderPoints(
      order.userId,
      order.id,
      pointsEarned,
      `Earned from Order #${order.orderNumber}`,
      isTierUpgraded ? newTier : undefined
    );

    if (!transaction) {
      return null; // Idempotently skipped duplicate
    }

    // 1. Order Points Notification
    await notificationService.createNotification({
      userId: order.userId,
      title: `+${pointsEarned} Circle Points Earned!`,
      message: `You earned ${pointsEarned} points for order ${order.orderNumber}.`,
      type: NotificationType.LOYALTY,
      metadata: { orderId: order.id, points: pointsEarned },
    });

    // 2. Tier Upgrade Notification if unlocked new tier
    if (isTierUpgraded) {
      await notificationService.createNotification({
        userId: order.userId,
        title: `Tier Upgraded to ${newTier}! 🌟`,
        message: `Congratulations! You have unlocked TEZLAA Circle ${newTier} Tier benefits.`,
        type: NotificationType.LOYALTY,
        metadata: { newTier, lifetimePoints: newLifetimePoints },
      });
    }

    return { pointsEarned, updatedAccount, transaction };
  }

  async getTransactions(userId: string, limit = 20, page = 1) {
    return loyaltyRepository.getTransactionsByUserId(userId, limit, page);
  }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService;

