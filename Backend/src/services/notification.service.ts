import notificationRepository, { CreateNotificationDTO } from '../repositories/notification.repository.js';
import { emitNotification } from '../sockets/index.js';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  async getUserNotifications(userId: string, unreadOnly = false) {
    return notificationRepository.findByUserId(userId, unreadOnly);
  }

  async getUnreadCount(userId: string) {
    const count = await notificationRepository.countUnread(userId);
    return { unreadCount: count };
  }

  async createNotification(data: CreateNotificationDTO) {
    const notification = await notificationRepository.create(data);
    // Real-time delivery via Socket.IO
    emitNotification(data.userId, notification);
    return notification;
  }

  async markAsRead(id: string, userId: string) {
    return notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  }

  // Helper method for automated order status notifications
  async createOrderStatusNotification(
    userId: string,
    orderNumber: string,
    status: string,
    orderId: string
  ) {
    let title = 'Order Update';
    let message = `Your order ${orderNumber} status is now ${status.replace(/_/g, ' ')}.`;

    switch (status) {
      case 'CONFIRMED':
        title = 'Order Confirmed!';
        message = `Your order ${orderNumber} has been confirmed by our barista.`;
        break;
      case 'PREPARING':
        title = 'Kitchen is Brewing & Baking';
        message = `Our baristas are preparing your artisan order ${orderNumber}.`;
        break;
      case 'READY':
        title = 'Order is Ready!';
        message = `Order ${orderNumber} is freshly packed and ready.`;
        break;
      case 'OUT_FOR_DELIVERY':
        title = 'Out for Delivery 🛵';
        message = `Your order ${orderNumber} is on the way to your doorstep!`;
        break;
      case 'DELIVERED':
        title = 'Order Delivered!';
        message = `Your order ${orderNumber} has been delivered. Enjoy your TEZLAA meal!`;
        break;
      case 'READY_FOR_PICKUP':
        title = 'Ready for Pickup';
        message = `Order ${orderNumber} is waiting for you at the café counter.`;
        break;
      case 'PICKED_UP':
        title = 'Order Picked Up!';
        message = `Thank you for visiting TEZLAA Café. Enjoy your treats!`;
        break;
      case 'CANCELLED':
        title = 'Order Cancelled';
        message = `Your order ${orderNumber} has been cancelled.`;
        break;
    }

    return this.createNotification({
      userId,
      title,
      message,
      type: NotificationType.ORDER,
      metadata: { orderId, orderNumber, status },
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
