import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MedicalRecordsController } from './medical-records.controller.js';
import { MedicalRecordsService } from './medical-records.service.js';
import { MedicalRecord } from '../database/models/medical-record.model.js';
import { Prescription } from '../database/models/prescription.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { SpacesService } from '../common/services/spaces.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([MedicalRecord, Prescription, Doctor]),
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, SpacesService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule { }
