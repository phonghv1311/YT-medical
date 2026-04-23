import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { Staff } from '../database/models/staff.model.js';
import { Hospital } from '../database/models/hospital.model.js';
import { Transaction } from '../database/models/transaction.model.js';

@Module({
  imports: [SequelizeModule.forFeature([User, Role, Doctor, Staff, Hospital, Transaction])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

