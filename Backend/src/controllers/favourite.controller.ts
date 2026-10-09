import { Response } from 'express';
import favouriteService from '../services/favourite.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';

export class FavouriteController {
  getFavourites = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const products = await favouriteService.getFavourites(userId);
    return ApiResponse.success(res, products, 'Favorites retrieved successfully');
  });

  toggleFavourite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const { productId } = req.params;
    const result = await favouriteService.toggleFavourite(userId, productId);
    return ApiResponse.success(res, result, result.message);
  });

  removeFavourite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const { productId } = req.params;
    const result = await favouriteService.removeFavourite(userId, productId);
    return ApiResponse.success(res, result, result.message);
  });
}

export const favouriteController = new FavouriteController();
export default favouriteController;
