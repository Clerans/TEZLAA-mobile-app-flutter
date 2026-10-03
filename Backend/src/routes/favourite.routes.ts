import { Router } from 'express';
import favouriteController from '../controllers/favourite.controller.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';

const router = Router();

// All favourite endpoints require JWT authentication
router.use(authenticateJwt as any);

// GET /api/v1/favourites
router.get('/', favouriteController.getFavourites as any);

// POST /api/v1/favourites/:productId/toggle
router.post('/:productId/toggle', favouriteController.toggleFavourite as any);

// DELETE /api/v1/favourites/:productId
router.delete('/:productId', favouriteController.removeFavourite as any);

export default router;
