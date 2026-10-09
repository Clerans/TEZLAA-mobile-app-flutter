import { Router } from 'express';
import categoryController from '../controllers/category.controller.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/catalog.validator.js';

const router = Router();

// GET /api/v1/categories
router.get('/', categoryController.getCategories);

// GET /api/v1/categories/:id
router.get('/:id', validate(idParamSchema), categoryController.getCategoryById);

export default router;
