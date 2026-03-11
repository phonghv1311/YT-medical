import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../common/guards/index.js';
import { CurrentUser } from '../common/decorators/index.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('appointments/:id/review')
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param('id', ParseIntPipe) appointmentId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(appointmentId, userId, dto);
  }

  @Get('doctors/:doctorId/reviews')
  getDoctorReviews(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getDoctorReviews(doctorId, page ? +page : 1, limit ? +limit : 20);
  }
}
