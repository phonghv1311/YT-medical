import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HospitalsController } from './hospitals.controller.js';
import { HospitalsService } from './hospitals.service.js';
import { Hospital } from '../database/models/hospital.model.js';
import { Department } from '../database/models/department.model.js';
import { User } from '../database/models/user.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { DoctorDepartment } from '../database/models/doctor-department.model.js';
import { Staff } from '../database/models/staff.model.js';
import { Appointment } from '../database/models/appointment.model.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Hospital, Department, User, Doctor, DoctorDepartment, Staff, Appointment]),
  ],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule { }
