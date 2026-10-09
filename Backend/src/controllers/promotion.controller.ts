import { Request, Response } from 'express';
import promotionService from '../services/promotion.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class PromotionController {
  getPromotions = asyncHandler(async (req: Request, res: Response) => {
    const promotions = await promotionService.getActivePromotions();
    return ApiResponse.success(res, promotions, 'Active promotions retrieved successfully');
  });

  getPromotionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const promotion = await promotionService.getPromotionById(id);
    return ApiResponse.success(res, promotion, 'Promotion details retrieved successfully');
  });
}

export const promotionController = new PromotionController();
export default promotionController;
