import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { Appointment } from '../database/models/appointment.model.js';
import { User } from '../database/models/user.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { AvailabilitySlot } from '../database/models/availability-slot.model.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Appointment, User, Doctor, AvailabilitySlot]),
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule { }
