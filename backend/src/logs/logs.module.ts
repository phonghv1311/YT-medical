import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LogsController } from './logs.controller.js';
import { LogsService } from './logs.service.js';
import { ActivityLog } from '../database/models/activity-log.model.js';

@Module({
  imports: [SequelizeModule.forFeature([ActivityLog])],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
