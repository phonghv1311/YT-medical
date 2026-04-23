import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';

import { NewsService, NEWS_QUEUE_NAME } from './news.service.js';

@Injectable()
export class NewsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsWorker.name);
  private worker?: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly newsService: NewsService,
  ) {}

  async onModuleInit() {
    const connection = {
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      password: this.config.get<string>('redis.password') || undefined,
    };

    this.worker = new Worker(
      NEWS_QUEUE_NAME,
      async (job) => {
        try {
          if (job.name === 'publish') {
            const articleId = Number(job.data?.articleId);
            if (!articleId) return;
            await this.newsService.publishIfDue(articleId);
            return;
          }
          if (job.name === 'scan') {
            await this.newsService.scanAndPublishDue();
            return;
          }
        } catch (e) {
          this.logger.error(`Failed job ${job.name}: ${String((e as Error).message || e)}`);
          throw e;
        }
      },
      { connection },
    );

    this.logger.log(`NewsWorker started on queue "${NEWS_QUEUE_NAME}"`);
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.logger.log('NewsWorker stopped');
  }
}

