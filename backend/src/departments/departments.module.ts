import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DepartmentsController } from './departments.controller.js';
import { DepartmentsService } from './departments.service.js';
import { Department } from '../database/models/department.model.js';
import { Staff } from '../database/models/staff.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Department, Staff])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule { }
