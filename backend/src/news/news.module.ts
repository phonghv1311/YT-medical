import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NewsArticle } from '../database/models/news-article.model.js';
import { User } from '../database/models/user.model.js';
import { Staff } from '../database/models/staff.model.js';
import { NewsController } from './news.controller.js';
import { NewsService } from './news.service.js';
import { NewsWorker } from './news.worker.js';
import { SpacesService } from '../common/services/index.js';

@Module({
  imports: [SequelizeModule.forFeature([NewsArticle, User, Staff])],
  controllers: [NewsController],
  providers: [NewsService, SpacesService, NewsWorker],
})
export class NewsModule { }
