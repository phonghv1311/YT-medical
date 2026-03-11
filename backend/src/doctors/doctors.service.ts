import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Doctor } from '../database/models/doctor.model.js';
import { User } from '../database/models/user.model.js';
import { Schedule } from '../database/models/schedule.model.js';
import { AvailabilitySlot } from '../database/models/availability-slot.model.js';
import { DoctorDepartment } from '../database/models/doctor-department.model.js';
import { Department } from '../database/models/department.model.js';
import { DoctorSpecialization } from '../database/models/doctor-specialization.model.js';
import { Specialization } from '../database/models/specialization.model.js';
import { DoctorQualification } from '../database/models/doctor-qualification.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { Review } from '../database/models/review.model.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { DoctorOnboardingDto } from './dto/doctor-onboarding.dto.js';
import { PaymentsService } from '../payments/payments.service.js';
import type { WhereOptions } from 'sequelize';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Schedule) private readonly scheduleModel: typeof Schedule,
    @InjectModel(AvailabilitySlot) private readonly availabilitySlotModel: typeof AvailabilitySlot,
    @InjectModel(DoctorDepartment) private readonly doctorDepartmentModel: typeof DoctorDepartment,
    @InjectModel(DoctorSpecialization) private readonly doctorSpecializationModel: typeof DoctorSpecialization,
    @InjectModel(Specialization) private readonly specializationModel: typeof Specialization,
    @InjectModel(DoctorQualification) private readonly doctorQualificationModel: typeof DoctorQualification,
    @InjectModel(Appointment) private readonly appointmentModel: typeof Appointment,
    @InjectModel(Review) private readonly reviewModel: typeof Review,
    private readonly paymentsService: PaymentsService,
  ) { }

  async findAll(filters?: {
    specialty?: string;
    hospitalId?: number;
    minRating?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: WhereOptions = {};

    // When filtering by specialty, resolve doctor IDs first to avoid duplicate rows from BelongsToMany join in findAndCountAll
    let doctorIds: number[] | undefined;
    if (filters?.specialty?.trim()) {
      const specializations = await this.specializationModel.findAll({
        where: { name: { [Op.like]: `%${filters.specialty.trim()}%` } },
        attributes: ['id'],
      });
      const specIds = specializations.map((s) => s.id);
      if (specIds.length === 0) {
        return { doctors: [], total: 0, page, limit };
      }
      const links = await this.doctorSpecializationModel.findAll({
        where: { specializationId: { [Op.in]: specIds } },
        attributes: ['doctorId'],
      });
      doctorIds = [...new Set(links.map((l) => l.doctorId))];
      if (doctorIds.length === 0) {
        return { doctors: [], total: 0, page, limit };
      }
      where.id = { [Op.in]: doctorIds };
    }

    if (filters?.minRating != null) {
      where.averageRating = { [Op.gte]: filters.minRating };
    }

    const include: any[] = [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
      { model: Specialization, through: { attributes: [] }, attributes: ['id', 'name'] },
    ];

    if (filters?.hospitalId) {
      include.push({
        model: DoctorDepartment,
        attributes: [],
        required: true,
        include: [
          { model: Department, where: { hospitalId: filters.hospitalId, isActive: true }, required: true, attributes: [] },
        ],
      });
    }

    // subQuery: false avoids MySQL errors with findAndCountAll + distinct + includes
    const { rows, count } = await this.doctorModel.findAndCountAll({
      where,
      include,
      offset,
      limit,
      order: [['averageRating', 'DESC']],
      distinct: true,
      subQuery: false,
    });

    return { doctors: rows, total: count, page, limit };
  }

  async findOne(id: number) {
    const doctor = await this.doctorModel.findByPk(id, {
      include: [
        { model: User, attributes: { exclude: ['password', 'refreshToken'] } },
        { model: DoctorQualification },
        { model: Specialization, through: { attributes: [] } },
        { model: DoctorDepartment },
      ],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findByUserId(userId: number) {
    const doctor = await this.doctorModel.findOne({
      where: { userId },
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: Specialization, through: { attributes: [] }, attributes: ['id', 'name'] },
      ],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findAllSpecializations() {
    return this.specializationModel.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
  }

  async updateOnboarding(userId: number, dto: DoctorOnboardingDto) {
    const doctor = await this.doctorModel.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (dto.firstName != null || dto.lastName != null) {
      const user = await this.userModel.findByPk(doctor.userId);
      if (user) {
        if (dto.firstName != null) user.firstName = dto.firstName;
        if (dto.lastName != null) user.lastName = dto.lastName;
        await user.save();
      }
    }

    if (
      dto.licenseNumber != null
      || dto.yearsOfExperience != null
      || dto.bio != null
    ) {
      if (dto.licenseNumber != null) doctor.licenseNumber = dto.licenseNumber;
      if (dto.yearsOfExperience != null) doctor.yearsOfExperience = dto.yearsOfExperience;
      if (dto.bio != null) doctor.bio = dto.bio;
      await doctor.save();
    }

    if (dto.specializationIds !== undefined) {
      await this.doctorSpecializationModel.destroy({ where: { doctorId: doctor.id } });
      if (dto.specializationIds.length > 0) {
        await this.doctorSpecializationModel.bulkCreate(
          dto.specializationIds.map((specializationId) => ({
            doctorId: doctor.id,
            specializationId,
          })),
        );
      }
    }

    if (dto.qualifications !== undefined) {
      await this.doctorQualificationModel.destroy({ where: { doctorId: doctor.id } });
      if (dto.qualifications.length > 0) {
        await this.doctorQualificationModel.bulkCreate(
          dto.qualifications.map((q) => ({
            doctorId: doctor.id,
            qualification: q.qualification,
            institution: q.institution ?? null,
            year: q.year ?? null,
          })),
        );
      }
    }

    if (dto.primaryDepartmentId !== undefined) {
      await this.doctorDepartmentModel.destroy({ where: { doctorId: doctor.id } });
      if (dto.primaryDepartmentId != null) {
        await this.doctorDepartmentModel.create({
          doctorId: doctor.id,
          departmentId: dto.primaryDepartmentId,
        });
      }
    }

    return this.findByUserId(userId);
  }

  private async resolveDoctorId(userId: number): Promise<number> {
    const doctor = await this.doctorModel.findOne({ where: { userId }, attributes: ['id'] });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor.id;
  }

  async getScheduleByUserId(userId: number) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.getSchedule(doctorId);
  }

  async createScheduleByUserId(userId: number, dto: CreateScheduleDto) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.createSchedule(doctorId, dto);
  }

  async getAvailabilityByUserId(userId: number, date?: string) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.getAvailability(doctorId, date);
  }

  async createAvailabilityByUserId(userId: number, dto: CreateAvailabilityDto) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.createAvailability(doctorId, dto);
  }

  async deleteAvailabilityByUserId(userId: number, slotId: number) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.deleteAvailability(doctorId, slotId);
  }

  async getPatientsByUserId(userId: number) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.getPatients(doctorId);
  }

  async getAppointmentsByUserId(userId: number) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.getAppointments(doctorId);
  }

  async getEarningsByUserId(userId: number, dateFrom?: string, dateTo?: string) {
    const doctorId = await this.resolveDoctorId(userId);
    return this.paymentsService.getDoctorEarnings(doctorId, dateFrom, dateTo);
  }

  async getSchedule(doctorId: number) {
    await this.ensureDoctorExists(doctorId);
    return this.scheduleModel.findAll({
      where: { doctorId, isActive: true },
      order: [['dayOfWeek', 'ASC']],
    });
  }

  async createSchedule(doctorId: number, dto: CreateScheduleDto) {
    await this.ensureDoctorExists(doctorId);
    return this.scheduleModel.create({
      doctorId,
      ...dto,
    } as Partial<Schedule>);
  }

  async getAvailability(doctorId: number, date?: string) {
    await this.ensureDoctorExists(doctorId);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const where: WhereOptions = { doctorId, isBooked: false };
    if (date) {
      if (date < today) return []; // do not return past slots
      where.date = date;
    } else {
      where.date = { [Op.gte]: today };
    }
    return this.availabilitySlotModel.findAll({
      where,
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
  }

  async createAvailability(doctorId: number, dto: CreateAvailabilityDto) {
    await this.ensureDoctorExists(doctorId);
    return this.availabilitySlotModel.create({
      doctorId,
      ...dto,
    } as Partial<AvailabilitySlot>);
  }

  async deleteAvailability(doctorId: number, slotId: number) {
    await this.ensureDoctorExists(doctorId);
    const slot = await this.availabilitySlotModel.findOne({
      where: { id: slotId, doctorId },
    });
    if (!slot) throw new NotFoundException('Availability slot not found');
    await slot.destroy();
    return { message: 'Deleted' };
  }

  async getPatients(doctorId: number) {
    await this.ensureDoctorExists(doctorId);
    const appointments = await this.appointmentModel.findAll({
      where: { doctorId },
      attributes: ['patientId'],
      raw: true,
    });
    const patientIds = [...new Set((appointments.map((a) => a.patientId)).filter(Boolean))];
    if (patientIds.length === 0) return [];
    const users = await this.userModel.findAll({
      where: { id: patientIds },
      attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
    });
    return users;
  }

  async getAppointments(doctorId: number) {
    await this.ensureDoctorExists(doctorId);
    return this.appointmentModel.findAll({
      where: { doctorId },
      include: [{ model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }],
      order: [['scheduledAt', 'DESC']],
    });
  }

  async getReviews(doctorId: number) {
    await this.ensureDoctorExists(doctorId);
    return this.reviewModel.findAll({
      where: { doctorId },
      include: [{ model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  private async ensureDoctorExists(id: number) {
    const doctor = await this.doctorModel.findByPk(id);
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }
}
