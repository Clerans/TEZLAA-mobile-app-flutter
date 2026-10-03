import { Router } from 'express';
import promotionController from '../controllers/promotion.controller.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/catalog.validator.js';

const router = Router();

// GET /api/v1/promotions
router.get('/', promotionController.getPromotions);

// GET /api/v1/promotions/:id
router.get('/:id', validate(idParamSchema), promotionController.getPromotionById);

export default router;
