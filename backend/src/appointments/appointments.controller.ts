import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto.js';
import { AppointmentNotesDto } from './dto/appointment-notes.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Get()
  findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appointmentsService.findAll(userId, role, {
      status,
      dateFrom,
      dateTo,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Post()
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(userId, dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.appointmentsService.findOne(id, userId, role);
  }

  @Put(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(id, userId, dto);
  }

  @Put(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') doctorId: number,
  ) {
    return this.appointmentsService.confirm(id, doctorId);
  }

  @Post(':id/start-call')
  startCall(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.startCall(id);
  }

  @Post(':id/end-call')
  endCall(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AppointmentNotesDto,
  ) {
    return this.appointmentsService.endCall(id, dto.notes);
  }
}
