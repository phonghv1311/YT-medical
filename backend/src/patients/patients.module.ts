import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PatientsController } from './patients.controller.js';
import { PatientsService } from './patients.service.js';
import { User } from '../database/models/user.model.js';
import { Customer } from '../database/models/customer.model.js';
import { FamilyMember } from '../database/models/family-member.model.js';
import { MedicalRecord } from '../database/models/medical-record.model.js';
import { PatientStatus } from '../database/models/patient-status.model.js';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Customer, FamilyMember, MedicalRecord, PatientStatus]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
