import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { ChatFeedbackDto } from './dto/chat-feedback.dto.js';
import { JwtAuthGuard } from '../common/guards/index.js';
import { CurrentUser } from '../common/decorators/index.js';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('id') userId: number, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(userId, dto);
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  chat(@Body() dto: ChatFeedbackDto) {
    return this.feedbackService.chat(dto);
  }
}
