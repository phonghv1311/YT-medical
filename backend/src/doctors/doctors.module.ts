import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DoctorsController } from './doctors.controller.js';
import { DoctorsService } from './doctors.service.js';
import { DoctorCertificatesService } from './doctor-certificates.service.js';
import { DoctorCertificateUploadService } from './doctor-certificate-upload.service.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { Doctor } from '../database/models/doctor.model.js';
import { DoctorCertificate } from '../database/models/doctor-certificate.model.js';
import { User } from '../database/models/user.model.js';
import { Schedule } from '../database/models/schedule.model.js';
import { AvailabilitySlot } from '../database/models/availability-slot.model.js';
import { DoctorDepartment } from '../database/models/doctor-department.model.js';
import { DoctorSpecialization } from '../database/models/doctor-specialization.model.js';
import { Specialization } from '../database/models/specialization.model.js';
import { DoctorQualification } from '../database/models/doctor-qualification.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { Review } from '../database/models/review.model.js';
import { Department } from '../database/models/department.model.js';

@Module({
  imports: [
    PaymentsModule,
    SequelizeModule.forFeature([
      Doctor,
      DoctorCertificate,
      User,
      Schedule,
      AvailabilitySlot,
      DoctorDepartment,
      Department,
      DoctorSpecialization,
      Specialization,
      DoctorQualification,
      Appointment,
      Review,
    ]),
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorCertificatesService, DoctorCertificateUploadService],
  exports: [DoctorsService],
})
export class DoctorsModule { }
