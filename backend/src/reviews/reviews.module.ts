import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { Review } from '../database/models/review.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { Doctor } from '../database/models/doctor.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Review, Appointment, Doctor])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
