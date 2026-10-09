import { Response } from 'express';
import notificationService from '../services/notification.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';

export class NotificationController {
  getUserNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const { unread } = req.query;
    const notifications = await notificationService.getUserNotifications(
      userId,
      unread === 'true'
    );
    return ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
  });

  getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const result = await notificationService.getUnreadCount(userId);
    return ApiResponse.success(res, result, 'Unread count retrieved');
  });

  markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, userId);
    return ApiResponse.success(res, notification, 'Notification marked as read');
  });

  markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const result = await notificationService.markAllAsRead(userId);
    return ApiResponse.success(res, result, 'All notifications marked as read');
  });
}

export const notificationController = new NotificationController();
export default notificationController;
