import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { BuyPackageDto } from './dto/buy-package.dto.js';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto.js';
import { CreateTipDto } from './dto/create-tip.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('packages')
  getPackages() {
    return this.paymentsService.getPackages();
  }

  @Post('packages/buy')
  @UseGuards(JwtAuthGuard)
  buyPackage(@CurrentUser('id') userId: number, @Body() dto: BuyPackageDto) {
    return this.paymentsService.buyPackage(userId, dto);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  getTransactions(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getTransactions(userId, page ? +page : 1, limit ? +limit : 20);
  }

  @Post('payment-methods')
  @UseGuards(JwtAuthGuard)
  addPaymentMethod(@CurrentUser('id') userId: number, @Body() dto: CreatePaymentMethodDto) {
    return this.paymentsService.addPaymentMethod(userId, dto);
  }

  @Get('payment-methods')
  @UseGuards(JwtAuthGuard)
  getPaymentMethods(@CurrentUser('id') userId: number) {
    return this.paymentsService.getPaymentMethods(userId);
  }

  @Post('appointments/:id/tip')
  @UseGuards(JwtAuthGuard)
  tipDoctor(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() dto: CreateTipDto,
  ) {
    return this.paymentsService.tipDoctor(userId, appointmentId, dto);
  }

  @Get('doctors/:doctorId/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'admin')
  getDoctorEarnings(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentsService.getDoctorEarnings(doctorId, dateFrom, dateTo);
  }
}
