import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Op } from 'sequelize';

import { NewsArticle, type NewsArticleStatus } from '../database/models/news-article.model.js';
import { User } from '../database/models/user.model.js';
import { Staff } from '../database/models/staff.model.js';
import { SpacesService } from '../common/services/index.js';

const NEWS_QUEUE_NAME = 'news-publish';

type CreateOrUpdatePayload = {
  title: string;
  category?: string;
  status?: NewsArticleStatus;
  scheduledAt?: string;
  content?: string;
};

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly queue: Queue;

  constructor(
    @InjectModel(NewsArticle) private readonly newsArticleModel: typeof NewsArticle,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    private readonly spacesService: SpacesService,
    private readonly config: ConfigService,
  ) {
    this.queue = new Queue(NEWS_QUEUE_NAME, {
      connection: {
        host: this.config.get<string>('redis.host'),
        port: this.config.get<number>('redis.port'),
        password: this.config.get<string>('redis.password') || undefined,
      },
    });
  }

  async onModuleInit() {
    // Periodic scan fallback (in case delayed jobs are missed)
    // This also satisfies the "event/command scan scheduled jobs" requirement.
    await this.queue.add(
      'scan',
      {},
      {
        repeat: { pattern: '*/1 * * * *' }, // every minute
        jobId: 'news-scan-repeat',
      },
    );
  }

  private async resolveAdminHospitalId(adminUserId: number): Promise<number | null> {
    const myStaff = await this.staffModel.findOne({
      where: { userId: adminUserId },
      attributes: ['hospitalId'],
    });
    return myStaff?.hospitalId ?? null;
  }

  private parseContent(content?: string): string[] {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
      // Fallback: allow newline text
      if (typeof parsed === 'string') return parsed.split(/\n\s*\n/).filter(Boolean);
    } catch {
      // If not JSON, treat as textarea text
      return String(content).split(/\n\s*\n/).filter(Boolean);
    }
    return [];
  }

  async list() {
    return this.newsArticleModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async listScoped(scope?: { requesterRole?: string; requesterId?: number }) {
    const requesterRole = scope?.requesterRole ?? '';
    const requesterId = scope?.requesterId;
    const hospitalId = requesterRole === 'admin' && requesterId != null ? await this.resolveAdminHospitalId(requesterId) : null;

    if (requesterRole === 'admin') {
      if (!hospitalId) return [];
      return this.newsArticleModel.findAll({
        where: {},
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: this.userModel,
            required: true,
            include: [
              {
                model: this.staffModel,
                required: true,
                where: { hospitalId },
              },
            ],
          },
        ],
      });
    }

    return this.newsArticleModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async getById(id: number, scope?: { requesterRole?: string; requesterId?: number }) {
    const requesterRole = scope?.requesterRole ?? '';
    const requesterId = scope?.requesterId;
    if (requesterRole === 'admin' && requesterId != null) {
      const hospitalId = await this.resolveAdminHospitalId(requesterId);
      if (!hospitalId) throw new NotFoundException('News article not found');
      const article = await this.newsArticleModel.findOne({
        where: { id },
        include: [
          {
            model: this.userModel,
            required: true,
            include: [
              { model: this.staffModel, required: true, where: { hospitalId } },
            ],
          },
        ],
      });
      if (!article) throw new NotFoundException('News article not found');
      return article;
    }

    const article = await this.newsArticleModel.findByPk(id);
    if (!article) throw new NotFoundException('News article not found');
    return article;
  }

  async create(payload: CreateOrUpdatePayload, coverFile?: Express.Multer.File, createdByUserId?: number) {
    const status: NewsArticleStatus = payload.status ?? 'PUBLISHED';

    let scheduledAt: Date | null = null;
    if (status === 'SCHEDULED') {
      if (!payload.scheduledAt) throw new BadRequestException('scheduledAt is required when status = SCHEDULED');
      scheduledAt = new Date(payload.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('scheduledAt is invalid');
    }

    const content = this.parseContent(payload.content);

    let coverImageUrl: string | null = null;
    let coverImageKey: string | null = null;
    if (coverFile) {
      const { url, key } = await this.spacesService.upload(coverFile, 'news');
      coverImageUrl = url;
      coverImageKey = key;
    }

    const article = await this.newsArticleModel.create({
      title: payload.title,
      category: payload.category ?? null,
      content,
      status,
      scheduledAt,
      coverImageUrl,
      coverImageKey,
      createdByUserId: createdByUserId ?? null,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    } as Partial<NewsArticle>);

    if (status === 'SCHEDULED' && scheduledAt) {
      const delayMs = scheduledAt.getTime() - Date.now();
      if (delayMs <= 0) {
        await this.publishIfDue(article.id);
      } else {
        await this.queue.add('publish', { articleId: article.id }, { delay: delayMs });
      }
    }

    return article;
  }

  async update(
    id: number,
    payload: CreateOrUpdatePayload,
    coverFile?: Express.Multer.File,
    performedByUserId?: number,
    scope?: { requesterRole?: string; requesterId?: number },
  ) {
    const article = await this.getById(id, scope);

    const status: NewsArticleStatus = payload.status ?? article.status ?? 'PUBLISHED';
    let scheduledAt: Date | null = article.scheduledAt ?? null;
    if (status === 'SCHEDULED') {
      if (payload.scheduledAt) {
        scheduledAt = new Date(payload.scheduledAt);
        if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('scheduledAt is invalid');
      } else if (!scheduledAt) {
        throw new BadRequestException('scheduledAt is required when status = SCHEDULED');
      }
    } else {
      scheduledAt = null;
    }

    let coverImageUrl = article.coverImageUrl;
    let coverImageKey = article.coverImageKey;
    if (coverFile) {
      // Replace cover
      if (coverImageKey) {
        await this.spacesService.delete(coverImageKey);
      }
      const { url, key } = await this.spacesService.upload(coverFile, 'news');
      coverImageUrl = url;
      coverImageKey = key;
    }

    const content = payload.content !== undefined ? this.parseContent(payload.content) : article.content;

    article.title = payload.title ?? article.title;
    article.category = payload.category ?? article.category;
    article.status = status;
    article.scheduledAt = scheduledAt;
    article.content = content;
    article.coverImageUrl = coverImageUrl;
    article.coverImageKey = coverImageKey;
    article.createdByUserId = performedByUserId ?? article.createdByUserId;
    article.publishedAt = status === 'PUBLISHED' ? new Date() : null;

    await article.save();

    if (status === 'SCHEDULED' && scheduledAt) {
      const delayMs = scheduledAt.getTime() - Date.now();
      if (delayMs <= 0) {
        await this.publishIfDue(article.id);
      } else {
        await this.queue.add('publish', { articleId: article.id }, { delay: delayMs });
      }
    }

    return article;
  }

  async delete(id: number, scope?: { requesterRole?: string; requesterId?: number }) {
    const article = await this.getById(id, scope);
    if (article.coverImageKey) {
      await this.spacesService.delete(article.coverImageKey);
    }
    await article.destroy();
    return { message: 'Deleted' };
  }

  async publishIfDue(articleId: number) {
    const article = await this.getById(articleId);
    if (article.status !== 'SCHEDULED') return article;

    if (!article.scheduledAt) return article;
    const now = new Date();
    if (article.scheduledAt.getTime() > now.getTime()) return article;

    article.status = 'PUBLISHED';
    article.publishedAt = now;
    await article.save();
    return article;
  }

  async scanAndPublishDue() {
    const now = new Date();
    const due = await this.newsArticleModel.findAll({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { [Op.lte]: now },
      },
    });

    for (const article of due) {
      await this.publishIfDue(article.id);
    }
  }
}

export { NEWS_QUEUE_NAME };

