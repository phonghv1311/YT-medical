import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';
import { StaffUploadService } from './staff-upload.service.js';
import { Staff } from '../database/models/staff.model.js';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Department } from '../database/models/department.model.js';
import { Hospital } from '../database/models/hospital.model.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Staff, User, Role, Department, Hospital]),
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffUploadService],
  exports: [StaffService],
})
export class StaffModule { }
