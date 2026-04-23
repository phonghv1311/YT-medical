import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles } from '../common/decorators/index.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Superadmin dashboard summary: totals + MoM deltas + cashflow series. */
  @Get('superadmin-dashboard')
  @Roles('superadmin')
  getSuperadminDashboard() {
    return this.reportsService.getSuperadminDashboard();
  }
}

