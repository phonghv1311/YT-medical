import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Review } from '../database/models/review.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { User } from '../database/models/user.model.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review) private readonly reviewModel: typeof Review,
    @InjectModel(Appointment) private readonly appointmentModel: typeof Appointment,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
  ) {}

  async createReview(appointmentId: number, patientId: number, dto: CreateReviewDto) {
    const appointment = await this.appointmentModel.findByPk(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.patientId !== patientId) {
      throw new BadRequestException('You can only review your own appointments');
    }

    const existing = await this.reviewModel.findOne({ where: { appointmentId } });
    if (existing) throw new BadRequestException('Review already exists for this appointment');

    const review = await this.reviewModel.create({
      appointmentId,
      patientId,
      doctorId: appointment.doctorId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    } as Partial<Review>);

    const avgResult = await this.reviewModel.findOne({
      where: { doctorId: appointment.doctorId },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'avg'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt'],
      ],
      raw: true,
    }) as unknown as { avg: string; cnt: string };

    await this.doctorModel.update(
      {
        averageRating: parseFloat(avgResult.avg) || 0,
        totalReviews: parseInt(avgResult.cnt, 10) || 0,
      },
      { where: { id: appointment.doctorId } },
    );

    return review;
  }

  async getDoctorReviews(doctorId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows, count } = await this.reviewModel.findAndCountAll({
      where: { doctorId },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { reviews: rows, total: count, page, limit };
  }
}
