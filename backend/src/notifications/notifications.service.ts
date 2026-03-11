import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from '../database/models/notification.model.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification) private readonly notificationModel: typeof Notification,
  ) { }

  async create(userId: number, type: string, title: string, body: string) {
    return this.notificationModel.create({
      userId,
      type: type as Notification['type'],
      title,
      body,
    } as Partial<Notification>);
  }

  async findAll(userId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows, count } = await this.notificationModel.findAndCountAll({
      where: { userId },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { notifications: rows, total: count, page, limit };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationModel.findOne({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    await notification.update({ readAt: new Date() });
    return notification;
  }

  async markAllAsRead(userId: number) {
    const [count] = await this.notificationModel.update(
      { readAt: new Date() },
      { where: { userId, readAt: null } },
    );
    return { updated: count };
  }
}
