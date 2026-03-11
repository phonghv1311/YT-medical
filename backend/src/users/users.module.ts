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

@Module({
  imports: [SequelizeModule.forFeature([User, Role, Customer, Doctor, DoctorDepartment])],
  controllers: [UsersController],
  providers: [UsersService, UsersAvatarService],
  exports: [UsersService],
})
export class UsersModule {}
