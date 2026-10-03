import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';
import { idParamSchema } from '../validators/catalog.validator.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All notification routes require JWT authentication
router.use(authenticateJwt as any);

// GET /api/v1/notifications
router.get('/', notificationController.getUserNotifications as any);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount as any);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', notificationController.markAllAsRead as any);
router.post('/read-all', notificationController.markAllAsRead as any);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', validate(idParamSchema), notificationController.markAsRead as any);
router.post('/:id/read', validate(idParamSchema), notificationController.markAsRead as any);

export default router;
