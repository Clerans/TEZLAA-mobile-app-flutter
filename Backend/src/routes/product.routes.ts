import { Router } from 'express';
import productController from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.js';
import { productQuerySchema, idParamSchema } from '../validators/catalog.validator.js';

const router = Router();

// GET /api/v1/products/featured
router.get('/featured', productController.getFeaturedProducts);

// GET /api/v1/products/fresh-today
router.get('/fresh-today', productController.getFreshTodayProducts);

// GET /api/v1/products
router.get('/', validate(productQuerySchema), productController.getProducts);

// GET /api/v1/products/:id
router.get('/:id', validate(idParamSchema), productController.getProductById);

export default router;
