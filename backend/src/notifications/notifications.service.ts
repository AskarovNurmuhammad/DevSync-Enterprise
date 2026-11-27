import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../realtime/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createNotification(params: {
    userId: string;
    workspaceId?: string;
    title: string;
    message: string;
    type?: string;
    entityId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        workspaceId: params.workspaceId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        entityId: params.entityId,
      },
    });

    this.eventsGateway.emitToUser(params.userId, 'notification:new', notification);
    return notification;
  }

  async getUserNotifications(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { items, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
