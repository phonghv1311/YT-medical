import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Doctor } from '../database/models/doctor.model.js';
import { User } from '../database/models/user.model.js';
import { Specialization } from '../database/models/specialization.model.js';
import { DoctorSpecialization } from '../database/models/doctor-specialization.model.js';
import { Hospital } from '../database/models/hospital.model.js';
import { SearchService } from './search.service.js';
import { SearchController } from './search.controller.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Doctor, User, Specialization, DoctorSpecialization, Hospital]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
