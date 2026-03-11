import {
  Controller, Get, Put, Post, Param, Query, Body, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { JwtAuthGuard } from '../common/guards/index.js';
import { CurrentUser } from '../common/decorators/index.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(userId, dto.type, dto.title, dto.body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(userId, page ? +page : 1, limit ? +limit : 20);
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@CurrentUser('id') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }
}
