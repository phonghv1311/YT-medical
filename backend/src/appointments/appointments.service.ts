import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Appointment, AppointmentStatus, AppointmentType } from '../database/models/appointment.model.js';
import { User } from '../database/models/user.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { AvailabilitySlot } from '../database/models/availability-slot.model.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment) private readonly appointmentModel: typeof Appointment,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(AvailabilitySlot) private readonly slotModel: typeof AvailabilitySlot,
    private readonly notificationsService: NotificationsService,
  ) { }

  async findAll(
    userId: number,
    role: string,
    filters: { status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (role === 'customer') {
      where.patientId = userId;
    } else if (role === 'doctor') {
      const doctor = await this.doctorModel.findOne({ where: { userId } });
      if (!doctor) throw new NotFoundException('Doctor profile not found');
      where.doctorId = doctor.id;
    }

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.scheduledAt = {};
      if (filters.dateFrom) (where.scheduledAt as Record<symbol, string>)[Op.gte] = filters.dateFrom;
      if (filters.dateTo) (where.scheduledAt as Record<symbol, string>)[Op.lte] = filters.dateTo;
    }

    const { rows, count } = await this.appointmentModel.findAndCountAll({
      where,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: Doctor, include: [{ model: User, attributes: ['firstName', 'lastName'] }] },
      ],
      offset,
      limit,
      order: [['scheduledAt', 'DESC'], ['startTime', 'ASC']],
    });

    return { appointments: rows, total: count, page, limit };
  }

  /** Fetch appointment by id (no auth). Use findOne from controllers when auth is required. */
  private async findById(id: number) {
    const appointment = await this.appointmentModel.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: { exclude: ['password', 'refreshToken'] } },
        { model: Doctor, include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'avatar'] }] },
        { model: AvailabilitySlot },
      ],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async findOne(id: number, userId: number, role: string) {
    const appointment = await this.findById(id);
    if (role === 'customer') {
      if (appointment.patientId !== userId) throw new ForbiddenException('You do not have access to this appointment');
    } else if (role === 'doctor') {
      const doctor = await this.doctorModel.findOne({ where: { userId } });
      if (!doctor || appointment.doctorId !== doctor.id) throw new ForbiddenException('You do not have access to this appointment');
    }
    return appointment;
  }

  async create(patientId: number, dto: CreateAppointmentDto) {
    const doctor = await this.doctorModel.findByPk(dto.doctorId);
    if (!doctor) throw new NotFoundException('Doctor not found');

    const today = new Date().toISOString().slice(0, 10);
    if (dto.scheduledAt < today) {
      throw new BadRequestException('Appointment date cannot be in the past');
    }

    if (dto.slotId) {
      const slot = await this.slotModel.findByPk(dto.slotId);
      if (!slot) throw new NotFoundException('Slot not found');
      if (slot.doctorId !== dto.doctorId) throw new BadRequestException('Slot does not belong to this doctor');
      if (slot.date !== dto.scheduledAt) throw new BadRequestException('Slot date does not match selected date');
      if (slot.isBooked) throw new BadRequestException('Slot is already booked');
      if (slot.date < today) throw new BadRequestException('Slot has expired');
      await slot.update({ isBooked: true });
    }

    const appointment = await this.appointmentModel.create({
      patientId,
      doctorId: dto.doctorId,
      scheduledAt: dto.scheduledAt,
      startTime: dto.startTime,
      endTime: dto.endTime,
      type: (dto.type as AppointmentType) ?? AppointmentType.VIDEO,
      slotId: dto.slotId ?? null,
      status: AppointmentStatus.PENDING,
    } as Partial<Appointment>);

    await this.notificationsService.create(
      patientId,
      'appointment',
      'Booking confirmed',
      `Your appointment has been scheduled for ${dto.scheduledAt} at ${dto.startTime}.`,
    ).catch(() => { });

    return appointment;
  }

  async cancel(id: number, userId: number, dto: CancelAppointmentDto) {
    const appointment = await this.findById(id);
    if (appointment.patientId !== userId && appointment.doctor?.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this appointment');
    }
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.slotId) {
      await this.slotModel.update({ isBooked: false }, { where: { id: appointment.slotId } });
    }

    await appointment.update({
      status: AppointmentStatus.CANCELLED,
      cancelReason: dto.cancelReason ?? null,
    });
    return appointment;
  }

  async confirm(id: number, doctorId: number) {
    const appointment = await this.findById(id);
    const doctor = await this.doctorModel.findOne({ where: { userId: doctorId } });
    if (!doctor || appointment.doctorId !== doctor.id) {
      throw new ForbiddenException('Not authorized to confirm this appointment');
    }
    await appointment.update({ status: AppointmentStatus.CONFIRMED });
    return appointment;
  }

  async startCall(id: number) {
    const appointment = await this.findById(id);
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Appointment must be confirmed before starting');
    }
    await appointment.update({ status: AppointmentStatus.IN_PROGRESS });
    return appointment;
  }

  async endCall(id: number, notes?: string) {
    const appointment = await this.findById(id);
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException('Appointment is not in progress');
    }
    await appointment.update({
      status: AppointmentStatus.COMPLETED,
      notes: notes ?? appointment.notes,
    });
    return appointment;
  }

  async addNotes(id: number, notes: string) {
    const appointment = await this.findById(id);
    await appointment.update({ notes });
    return appointment;
  }
}
