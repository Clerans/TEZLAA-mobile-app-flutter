import { Response } from 'express';
import loyaltyService from '../services/loyalty.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';

export class LoyaltyController {
  getAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const account = await loyaltyService.getAccountDetails(userId);
    return ApiResponse.success(res, account, 'Loyalty account retrieved successfully');
  });

  getRewards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const rewards = await loyaltyService.getAvailableRewards(userId);
    return ApiResponse.success(res, rewards, 'Rewards catalog retrieved successfully');
  });

  redeemReward = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const rewardId = req.params.id || req.body.rewardId || req.body.id;
    if (!rewardId) {
      throw ApiError.badRequest('Reward ID is required');
    }

    const result = await loyaltyService.redeemReward(userId, rewardId);
    return ApiResponse.success(res, result, 'Reward redeemed successfully');
  });

  getTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await loyaltyService.getTransactions(userId, limit, page);
    return ApiResponse.success(
      res,
      data.transactions,
      'Loyalty transactions retrieved successfully',
      200,
      {
        page,
        limit,
        total: data.total,
        totalPages: Math.ceil(data.total / limit),
      }
    );
  });
}

export const loyaltyController = new LoyaltyController();
export default loyaltyController;
