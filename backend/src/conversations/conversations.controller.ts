import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/index.js';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  @Get()
  findAll() {
    return [];
  }
}
