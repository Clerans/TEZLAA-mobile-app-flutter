import { Router } from 'express';
import loyaltyController from '../controllers/loyalty.controller.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';
import { idParamSchema } from '../validators/catalog.validator.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All loyalty routes require JWT authentication
router.use(authenticateJwt as any);

// GET /api/v1/loyalty/account
router.get('/account', loyaltyController.getAccount as any);

// GET /api/v1/loyalty/rewards
router.get('/rewards', loyaltyController.getRewards as any);

// POST /api/v1/loyalty/rewards/:id/redeem
router.post('/rewards/:id/redeem', validate(idParamSchema), loyaltyController.redeemReward as any);
router.post('/redeem', loyaltyController.redeemReward as any);
router.post('/rewards/redeem', loyaltyController.redeemReward as any);

// GET /api/v1/loyalty/transactions
router.get('/transactions', loyaltyController.getTransactions as any);

export default router;
