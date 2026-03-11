import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { PatientsService } from './patients.service.js';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto.js';
import { UpdatePatientStatusDto } from './dto/update-patient-status.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Get('me/family-members')
  @UseGuards(JwtAuthGuard)
  getMyFamilyMembers(@CurrentUser('id') userId: number) {
    return this.patientsService.getFamilyMembersByUserId(userId);
  }

  @Post('me/family-members')
  @UseGuards(JwtAuthGuard)
  addMyFamilyMember(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateFamilyMemberDto,
  ) {
    return this.patientsService.addFamilyMemberByUserId(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'staff', 'admin')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.patientsService.findAll(page ? +page : 1, limit ? +limit : 20);
  }

  @Get(':id/records')
  @UseGuards(JwtAuthGuard)
  getRecords(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.getRecords(id);
  }

  @Post(':id/records')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createRecord(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') doctorId: number,
    @Body() dto: { title: string; description?: string; fileUrl?: string; fileKey?: string; recordDate: string },
  ) {
    return this.patientsService.createRecord(id, doctorId, dto);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  getStatus(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.getStatus(id);
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') doctorId: number,
    @Body() dto: UpdatePatientStatusDto,
  ) {
    return this.patientsService.updateStatus(id, doctorId, dto);
  }

  @Get(':id/family-members')
  @UseGuards(JwtAuthGuard)
  getFamilyMembers(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.getFamilyMembers(id);
  }

  @Post(':id/family-members')
  @UseGuards(JwtAuthGuard)
  addFamilyMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFamilyMemberDto,
  ) {
    return this.patientsService.addFamilyMember(id, dto);
  }
}
