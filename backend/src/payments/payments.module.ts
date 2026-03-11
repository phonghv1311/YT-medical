import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { Package } from '../database/models/package.model.js';
import { UserPackage } from '../database/models/user-package.model.js';
import { Transaction } from '../database/models/transaction.model.js';
import { PaymentMethod } from '../database/models/payment-method.model.js';
import { Tip } from '../database/models/tip.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { Doctor } from '../database/models/doctor.model.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Package, UserPackage, Transaction, PaymentMethod, Tip, Appointment, Doctor]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
