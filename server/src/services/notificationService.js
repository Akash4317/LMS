import Notification from '../models/notification.js';
import logger from '../utils/logger.js';
import { Server as SocketServer } from 'socket.io';

class notificationService {
  constructor() {
    this.io = null;
  }

  setSocketServer(io) {
    this.io = io;
  }

  async createNotification(
    userId,
    type,
    title,
    message,
    data = undefined,
    priority = 'MEDIUM',
    actionUrl = undefined
  ) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
      });

      // Emit real-time notification via Socket.IO
      if (this.io) {
        this.io.to(userId.toString()).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          data,
          priority,
          createdAt: notification.createdAt,
        });
      }

      logger.info(`Notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      logger.error('Notification creation failed:', error);
      throw error;
    }
  }

  async createBulkNotifications(
    userIds,
    type,
    title,
    message,
    data = undefined,
    priority = 'MEDIUM'
  ) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        data,
        priority,
      }));

      await Notification.insertMany(notifications);

      // Emit to all users
      if (this.io) {
        userIds.forEach(userId => {
          this.io.to(userId.toString()).emit('notification', {
            type,
            title,
            message,
            data,
            priority,
            createdAt: new Date(),
          });
        });
      }

      logger.info(`Bulk notifications created for ${userIds.length} users: ${type}`);
    } catch (error) {
      logger.error('Bulk notification creation failed:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      await Notification.findByIdAndUpdate(notificationId, {
        isRead: true,
        readAt: new Date(),
      });
    } catch (error) {
      logger.error('Mark as read failed:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      logger.error('Mark all as read failed:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        userId,
        isRead: false,
      });
    } catch (error) {
      logger.error('Get unread count failed:', error);
      return 0;
    }
  }
}

export default new notificationService();
