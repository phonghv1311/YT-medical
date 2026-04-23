import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles } from '../common/decorators/index.js';
import { ApprovalsService } from './approvals.service.js';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending-doctors')
  getPendingDoctors() {
    return this.approvalsService.getPendingDoctors();
  }

  @Get('pending-transfers')
  getPendingTransfers() {
    return this.approvalsService.getPendingTransfers();
  }

  @Get('pending-staff')
  getPendingStaff() {
    return this.approvalsService.getPendingStaff();
  }

  @Get('pending-hospitals')
  getPendingHospitals() {
    return this.approvalsService.getPendingHospitals();
  }

  @Get('pending-profiles')
  getPendingProfiles() {
    return this.approvalsService.getPendingProfiles();
  }

  @Get('pending-resignations')
  getPendingResignations() {
    return this.approvalsService.getPendingResignations();
  }

  @Get('pending-leave')
  getPendingLeave() {
    return this.approvalsService.getPendingLeave();
  }

  @Get('pending-salary-advance')
  getPendingSalaryAdvance() {
    return this.approvalsService.getPendingSalaryAdvance();
  }

  @Get('pending-appointments')
  getPendingAppointments() {
    return this.approvalsService.getPendingAppointments();
  }
}
