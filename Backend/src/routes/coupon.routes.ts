import { Router } from 'express';
import couponController from '../controllers/coupon.controller.js';
import { validate } from '../middleware/validate.js';
import { validateCouponSchema } from '../validators/order.validator.js';

const router = Router();

// POST /api/v1/coupons/validate
router.post('/validate', validate(validateCouponSchema), couponController.validateCoupon);

export default router;
