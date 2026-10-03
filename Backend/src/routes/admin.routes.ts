import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticateJwt, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createBranchSchema,
  updateBranchSchema,
  createCouponSchema,
  updateCouponSchema,
  createRewardSchema,
  updateRewardSchema,
  createPromotionSchema,
  updatePromotionSchema,
  adjustLoyaltySchema,
} from '../validators/admin.validator.js';

const router = Router();

// Secure all admin routes with JWT
router.use(authenticateJwt as any);

// 1. Dashboard
router.get('/dashboard', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.getDashboard as any);

// 2. Orders
router.get('/orders', requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any, adminController.getOrders as any);
router.get('/orders/:id', requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any, adminController.getOrderById as any);

// 3. Products
router.get('/products', requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any, adminController.getProducts as any);
router.post('/products', requireRole('ADMIN', 'BRANCH_MANAGER') as any, validate(createProductSchema) as any, adminController.createProduct as any);
router.put('/products/:id', requireRole('ADMIN', 'BRANCH_MANAGER') as any, validate(updateProductSchema) as any, adminController.updateProduct as any);
router.delete('/products/:id', requireRole('ADMIN') as any, adminController.deleteProduct as any);
router.patch('/products/:id/availability', requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any, adminController.toggleProductAvailability as any);

// 4. Categories
router.get('/categories', requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any, adminController.getCategories as any);
router.post('/categories', requireRole('ADMIN', 'BRANCH_MANAGER') as any, validate(createCategorySchema) as any, adminController.createCategory as any);
router.put('/categories/:id', requireRole('ADMIN', 'BRANCH_MANAGER') as any, validate(updateCategorySchema) as any, adminController.updateCategory as any);
router.delete('/categories/:id', requireRole('ADMIN') as any, adminController.deleteCategory as any);

// 5. Branches
router.get('/branches', requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any, adminController.getBranches as any);
router.post('/branches', requireRole('ADMIN') as any, validate(createBranchSchema) as any, adminController.createBranch as any);
router.put('/branches/:id', requireRole('ADMIN', 'BRANCH_MANAGER') as any, validate(updateBranchSchema) as any, adminController.updateBranch as any);
router.patch('/branches/:id/status', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.toggleBranchStatus as any);

// 6. Customers
router.get('/customers', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.getCustomers as any);
router.get('/customers/:id', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.getCustomerById as any);

// 7. Loyalty
router.get('/loyalty', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.getLoyalty as any);
router.post('/loyalty/adjust', requireRole('ADMIN') as any, validate(adjustLoyaltySchema) as any, adminController.adjustLoyalty as any);

// 8. Rewards
router.get('/rewards', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.getRewards as any);
router.post('/rewards', requireRole('ADMIN') as any, validate(createRewardSchema) as any, adminController.createReward as any);
router.put('/rewards/:id', requireRole('ADMIN') as any, validate(updateRewardSchema) as any, adminController.updateReward as any);
router.delete('/rewards/:id', requireRole('ADMIN') as any, adminController.deleteReward as any);

// 9. Promotions
router.get('/promotions', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.getPromotions as any);
router.post('/promotions', requireRole('ADMIN') as any, validate(createPromotionSchema) as any, adminController.createPromotion as any);
router.put('/promotions/:id', requireRole('ADMIN') as any, validate(updatePromotionSchema) as any, adminController.updatePromotion as any);
router.delete('/promotions/:id', requireRole('ADMIN') as any, adminController.deletePromotion as any);

// 10. Coupons
router.get('/coupons', requireRole('ADMIN', 'BRANCH_MANAGER') as any, adminController.getCoupons as any);
router.post('/coupons', requireRole('ADMIN') as any, validate(createCouponSchema) as any, adminController.createCoupon as any);
router.put('/coupons/:id', requireRole('ADMIN') as any, validate(updateCouponSchema) as any, adminController.updateCoupon as any);
router.delete('/coupons/:id', requireRole('ADMIN') as any, adminController.deleteCoupon as any);

// 11. Notifications
router.get('/notifications', requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any, adminController.getNotifications as any);

export default router;
