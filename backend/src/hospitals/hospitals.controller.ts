import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { HospitalsService } from './hospitals.service.js';
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';
import { DeactivateHospitalDto } from './dto/deactivate-hospital.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles, CurrentUser } from '../common/decorators/index.js';

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  findAll() {
    return this.hospitalsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hospitalsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  create(@Body() dto: CreateHospitalDto) {
    return this.hospitalsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHospitalDto,
    @CurrentUser('id') performedByUserId: number,
  ) {
    return this.hospitalsService.update(id, dto, performedByUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeactivateHospitalDto,
    @CurrentUser('id') performedByUserId: number,
  ) {
    return this.hospitalsService.remove(id, dto, performedByUserId);
  }
}
