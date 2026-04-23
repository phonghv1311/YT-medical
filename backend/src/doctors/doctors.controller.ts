import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DoctorsService } from './doctors.service.js';
import { DoctorCertificatesService } from './doctor-certificates.service.js';
import { DoctorCertificateUploadService } from './doctor-certificate-upload.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { DoctorOnboardingDto } from './dto/doctor-onboarding.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles, CurrentUser } from '../common/decorators/index.js';
import { DOCTOR_CERTIFICATE_TYPES } from '../database/models/doctor-certificate.model.js';

const CERT_FILE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const certFileUpload = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: (e: Error | null, accept: boolean) => void) => {
    const mime = file.mimetype?.toLowerCase();
    if (!mime || !CERT_FILE_MIMES.includes(mime)) {
      cb(new Error('Allowed: image (JPEG, PNG, GIF, WebP), PDF.'), false);
      return;
    }
    cb(null, true);
  },
};

@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly certificatesService: DoctorCertificatesService,
    private readonly certificateUploadService: DoctorCertificateUploadService,
  ) { }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMe(@CurrentUser('id') userId: number) {
    return this.doctorsService.findByUserId(userId);
  }

  @Get('me/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMeSchedule(@CurrentUser('id') userId: number) {
    return this.doctorsService.getScheduleByUserId(userId);
  }

  @Post('me/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createMeSchedule(@CurrentUser('id') userId: number, @Body() dto: CreateScheduleDto) {
    return this.doctorsService.createScheduleByUserId(userId, dto);
  }

  @Get('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMeAvailability(@CurrentUser('id') userId: number, @Query('date') date?: string) {
    return this.doctorsService.getAvailabilityByUserId(userId, date);
  }

  @Post('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createMeAvailability(@CurrentUser('id') userId: number, @Body() dto: CreateAvailabilityDto) {
    return this.doctorsService.createAvailabilityByUserId(userId, dto);
  }

  @Delete('me/availability/:slotId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  deleteMeAvailability(@CurrentUser('id') userId: number, @Param('slotId', ParseIntPipe) slotId: number) {
    return this.doctorsService.deleteAvailabilityByUserId(userId, slotId);
  }

  @Get('me/patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMePatients(@CurrentUser('id') userId: number) {
    return this.doctorsService.getPatientsByUserId(userId);
  }

  @Get('me/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMeAppointments(@CurrentUser('id') userId: number) {
    return this.doctorsService.getAppointmentsByUserId(userId);
  }

  @Get('me/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMeEarnings(
    @CurrentUser('id') userId: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.doctorsService.getEarningsByUserId(userId, dateFrom, dateTo);
  }

  @Patch('me/onboarding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  updateMeOnboarding(@CurrentUser('id') userId: number, @Body() dto: DoctorOnboardingDto) {
    return this.doctorsService.updateOnboarding(userId, dto);
  }

  @Get('me/rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMeRules() {
    return [];
  }

  @Get('me/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getMeRuleById(@Param('id') _id: string) {
    throw new NotFoundException('Rule not found');
  }

  @Get('me/certificates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  async getMeCertificates(@CurrentUser('id') userId: number) {
    const doctorId = await this.certificatesService.getDoctorIdByUserId(userId);
    return this.certificatesService.listByDoctorId(doctorId);
  }

  @Post('me/certificates/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @UseInterceptors(FileInterceptor('file', certFileUpload))
  async uploadCertificate(
    @CurrentUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    if (!type || !DOCTOR_CERTIFICATE_TYPES.includes(type as any)) {
      throw new BadRequestException(`type must be one of: ${DOCTOR_CERTIFICATE_TYPES.join(', ')}`);
    }
    const doctorId = await this.certificatesService.getDoctorIdByUserId(userId);
    const { url } = await this.certificateUploadService.uploadFile(file);
    return this.certificatesService.upsert(doctorId, type as any, url);
  }

  @Delete('me/certificates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  async deleteCertificate(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const doctorId = await this.certificatesService.getDoctorIdByUserId(userId);
    return this.certificatesService.deleteCertificate(doctorId, id);
  }

  @Post('me/certificates/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  async submitCertificates(@CurrentUser('id') userId: number) {
    const doctorId = await this.certificatesService.getDoctorIdByUserId(userId);
    return this.certificatesService.submitForVerification(doctorId);
  }

  @Get('meta/specializations')
  findAllSpecializations() {
    return this.doctorsService.findAllSpecializations();
  }

  @Get()
  findAll(
    @Query('specialty') specialty?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('minRating') minRating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page != null && page !== '' ? parseInt(page, 10) : 1;
    const parsedLimit = limit != null && limit !== '' ? parseInt(limit, 10) : 20;
    const parsedHospitalId = hospitalId != null && hospitalId !== '' ? parseInt(hospitalId, 10) : undefined;
    const parsedMinRating = minRating != null && minRating !== '' ? parseFloat(minRating) : undefined;
    return this.doctorsService.findAll({
      specialty: specialty?.trim() || undefined,
      hospitalId: parsedHospitalId != null && !Number.isNaN(parsedHospitalId) ? parsedHospitalId : undefined,
      minRating: parsedMinRating != null && !Number.isNaN(parsedMinRating) ? parsedMinRating : undefined,
      page: Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
      limit: Number.isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 100),
    });
  }

  @Get('by-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.doctorsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  @Get(':id/schedule')
  getSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getSchedule(id);
  }

  @Post(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.doctorsService.createSchedule(id, dto);
  }

  @Get(':id/availability')
  getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date?: string,
  ) {
    return this.doctorsService.getAvailability(id, date);
  }

  @Post(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.doctorsService.createAvailability(id, dto);
  }

  @Delete(':id/availability/:slotId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  deleteAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.doctorsService.deleteAvailability(id, slotId);
  }

  @Get(':id/patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'admin', 'superadmin')
  getPatients(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getPatients(id);
  }

  @Get(':id/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'admin', 'superadmin')
  getAppointments(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getAppointments(id);
  }

  @Get(':id/reviews')
  getReviews(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getReviews(id);
  }
}
