import couponRepository from '../repositories/coupon.repository.js';
import { ApiError } from '../utils/apiError.js';
import { DiscountType } from '@prisma/client';

export class CouponService {
  async validateCoupon(code: string, subtotal: number) {
    if (!code || !code.trim()) {
      throw ApiError.badRequest('Coupon code is required');
    }

    const coupon = await couponRepository.findByCode(code.trim());
    if (!coupon) {
      throw new ApiError(404, 'Invalid or expired coupon code');
    }

    if (!coupon.isActive) {
      throw new ApiError(400, 'This coupon is currently inactive');
    }

    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      throw new ApiError(400, 'This coupon is not valid at this time');
    }

    // Check usage limits taking active pending reservations into account
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
      const activeReservations = await couponRepository.getActiveReservationsCount(coupon.id);
      const totalEffectiveUsage = coupon.usageCount + activeReservations;

      if (totalEffectiveUsage >= coupon.usageLimit) {
        throw new ApiError(400, 'This coupon has reached its maximum redemption limit');
      }
    }

    if (subtotal < coupon.minOrderValue) {
      throw new ApiError(
        400,
        `This coupon requires a minimum order value of Rs. ${coupon.minOrderValue.toLocaleString()}`
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount),
      description: coupon.description,
    };
  }

  async reserveCoupon(userId: string, orderId: string, couponId: string, couponCode: string) {
    return couponRepository.createReservation({
      userId,
      orderId,
      couponId,
      couponCode,
    });
  }

  async commitCoupon(orderId: string) {
    return couponRepository.commitReservation(orderId);
  }

  async releaseCoupon(orderId: string) {
    return couponRepository.releaseReservation(orderId);
  }

  async markCouponUsed(couponId: string) {
    return couponRepository.incrementUsage(couponId);
  }
}

export const couponService = new CouponService();
export default couponService;

