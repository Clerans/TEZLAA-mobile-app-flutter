import { Router } from 'express';
import orderController from '../controllers/order.controller.js';
import { authenticateJwt, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { placeOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';
import { idParamSchema } from '../validators/catalog.validator.js';

const router = Router();

// All order endpoints require JWT authentication
router.use(authenticateJwt as any);

// POST /api/v1/orders/validate-cart (Pre-checkout validation)
router.post('/validate-cart', orderController.validateCart as any);

// POST /api/v1/orders (Place order)
router.post('/', validate(placeOrderSchema), orderController.placeOrder as any);

// GET /api/v1/orders (User order history)
router.get('/', orderController.getUserOrders as any);

// GET /api/v1/orders/:id (Order details)
router.get('/:id', validate(idParamSchema), orderController.getOrderById as any);

// Reorder endpoints (supports both POST and GET)
router.post('/:id/reorder', validate(idParamSchema), orderController.getReorderData as any);
router.get('/:id/reorder', validate(idParamSchema), orderController.getReorderData as any);

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', validate(idParamSchema), orderController.cancelOrder as any);

// PATCH /api/v1/orders/:id/status (Staff & Admin only status transition)
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF') as any,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus as any
);

export default router;
