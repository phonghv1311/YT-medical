import {
  Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MedicalRecordsService } from './medical-records.service.js';
import { CreateRecordDto } from './dto/create-record.dto.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @UseInterceptors(FileInterceptor('file'))
  uploadRecord(
    @Body('patientId', ParseIntPipe) patientId: number,
    @CurrentUser('id') doctorId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateRecordDto,
  ) {
    return this.medicalRecordsService.uploadRecord(patientId, doctorId, file, dto);
  }

  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard)
  getRecords(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.medicalRecordsService.getRecords(patientId);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  getRecordUrl(@Param('id', ParseIntPipe) id: number) {
    return this.medicalRecordsService.getRecordUrl(id);
  }

  @Post('prescriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createPrescription(
    @CurrentUser('id') doctorId: number,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.medicalRecordsService.createPrescription(doctorId, dto);
  }

  @Get('prescriptions/:patientId')
  @UseGuards(JwtAuthGuard)
  getPrescriptions(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.medicalRecordsService.getPrescriptions(patientId);
  }
}
