import prisma from '../config/database.js';
import { Notification, NotificationType } from '@prisma/client';

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: any;
}

export class NotificationRepository {
  async findByUserId(userId: string, unreadOnly = false, limit = 50): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async create(data: CreateNotificationDTO): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.SYSTEM,
        metadata: data.metadata,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error('Notification not found or unauthorized');
    }
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
