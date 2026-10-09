import { Request, Response } from 'express';
import couponService from '../services/coupon.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class CouponController {
  validateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { code, subtotal } = req.body;
    const result = await couponService.validateCoupon(code, subtotal);
    return ApiResponse.success(res, result, 'Coupon applied successfully');
  });
}

export const couponController = new CouponController();
export default couponController;
