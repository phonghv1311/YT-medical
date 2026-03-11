import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../database/models/activity-log.model.js';
import { User } from '../database/models/user.model.js';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(ActivityLog) private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async log(
    userId: number | null,
    action: string,
    resource: string,
    resourceId?: number,
    details?: string,
    ipAddress?: string,
  ) {
    return this.activityLogModel.create({
      userId,
      action,
      resource,
      resourceId: resourceId ?? null,
      details: details ?? null,
      ipAddress: ipAddress ?? null,
    } as Partial<ActivityLog>);
  }

  async findAll(
    page = 1,
    limit = 20,
    userId?: number,
    action?: string,
    resource?: string,
    resourceId?: number,
  ) {
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (userId) where['userId'] = userId;
    if (action) where['action'] = action;
    if (resource) where['resource'] = resource;
    if (resourceId != null) where['resourceId'] = resourceId;

    const { rows, count } = await this.activityLogModel.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { logs: rows, total: count, page, limit };
  }
}
