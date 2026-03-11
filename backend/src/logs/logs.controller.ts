import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles } from '../common/decorators/index.js';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.logsService.findAll(
      page ? +page : 1,
      limit ? +limit : 20,
      userId ? +userId : undefined,
      action,
      resource,
      resourceId ? +resourceId : undefined,
    );
  }
}
