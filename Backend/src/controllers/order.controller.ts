import { Response } from 'express';
import orderService from '../services/order.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';

export class OrderController {
  placeOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Please sign in to place an order');
    }

    const idempotencyKey =
      (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;

    const order = await orderService.placeOrder({
      userId,
      ...req.body,
      idempotencyKey,
    });

    return ApiResponse.created(res, order, 'Order confirmed successfully');
  });

  validateCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.validateCart(req.body);
    return ApiResponse.success(res, result, 'Cart validated successfully');
  });

  getUserOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const { status } = req.query;
    const orders = await orderService.getUserOrders(userId, status as string);
    return ApiResponse.success(res, orders, 'Orders retrieved successfully');
  });

  getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const { id } = req.params;
    const order = await orderService.getOrderById(id, userId);
    return ApiResponse.success(res, order, 'Order details retrieved successfully');
  });

  cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const { id } = req.params;
    const cancelled = await orderService.cancelOrder(id, userId);
    return ApiResponse.success(res, cancelled, 'Order cancelled successfully');
  });

  getReorderData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const { id } = req.params;
    const reorderData = await orderService.getReorderData(id, userId);
    return ApiResponse.success(res, reorderData, 'Reorder items verified successfully');
  });

  updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ApiError(400, 'Status is required');
    }

    const updated = await orderService.updateOrderStatus(
      id,
      status,
      req.user?.role,
      req.user?.branchId
    );
    return ApiResponse.success(res, updated, 'Order status updated successfully');
  });
}

export const orderController = new OrderController();
export default orderController;
