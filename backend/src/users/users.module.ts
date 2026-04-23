import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UsersAvatarService } from './users-avatar.service.js';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Customer } from '../database/models/customer.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { DoctorDepartment } from '../database/models/doctor-department.model.js';
import { Staff } from '../database/models/staff.model.js';
import { Hospital } from '../database/models/hospital.model.js';
import { Department } from '../database/models/department.model.js';
import { DoctorSpecialization } from '../database/models/doctor-specialization.model.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { LogsModule } from '../logs/logs.module.js';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Role, Customer, Doctor, DoctorDepartment, Staff, Hospital, Department, DoctorSpecialization]),
    NotificationsModule,
    LogsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersAvatarService],
  exports: [UsersService],
})
export class UsersModule { }
