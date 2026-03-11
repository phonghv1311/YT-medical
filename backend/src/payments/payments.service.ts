import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Package } from '../database/models/package.model.js';
import { UserPackage } from '../database/models/user-package.model.js';
import { Transaction, TransactionType, TransactionStatus } from '../database/models/transaction.model.js';
import { PaymentMethod } from '../database/models/payment-method.model.js';
import { Tip } from '../database/models/tip.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { BuyPackageDto } from './dto/buy-package.dto.js';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto.js';
import { CreateTipDto } from './dto/create-tip.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Package) private readonly packageModel: typeof Package,
    @InjectModel(UserPackage) private readonly userPackageModel: typeof UserPackage,
    @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
    @InjectModel(PaymentMethod) private readonly paymentMethodModel: typeof PaymentMethod,
    @InjectModel(Tip) private readonly tipModel: typeof Tip,
    @InjectModel(Appointment) private readonly appointmentModel: typeof Appointment,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
  ) {}

  async getPackages() {
    return this.packageModel.findAll({ where: { isActive: true } });
  }

  async buyPackage(userId: number, dto: BuyPackageDto) {
    const pkg = await this.packageModel.findByPk(dto.packageId);
    if (!pkg || !pkg.isActive) throw new NotFoundException('Package not found');

    const transaction = await this.transactionModel.create({
      userId,
      packageId: pkg.id,
      amount: pkg.price,
      type: TransactionType.PACKAGE,
      status: TransactionStatus.COMPLETED,
      paymentMethodId: dto.paymentMethodId ?? null,
    } as Partial<Transaction>);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pkg.durationDays);

    const userPackage = await this.userPackageModel.create({
      userId,
      packageId: pkg.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      consultationsUsed: 0,
      isActive: true,
    } as Partial<UserPackage>);

    return { transaction, userPackage };
  }

  async getTransactions(userId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows, count } = await this.transactionModel.findAndCountAll({
      where: { userId },
      include: [{ model: Package }, { model: PaymentMethod }],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { transactions: rows, total: count, page, limit };
  }

  async addPaymentMethod(userId: number, dto: CreatePaymentMethodDto) {
    if (dto.isDefault) {
      await this.paymentMethodModel.update(
        { isDefault: false },
        { where: { userId } },
      );
    }
    return this.paymentMethodModel.create({
      userId,
      ...dto,
    } as Partial<PaymentMethod>);
  }

  async getPaymentMethods(userId: number) {
    return this.paymentMethodModel.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });
  }

  async tipDoctor(userId: number, appointmentId: number, dto: CreateTipDto) {
    const appointment = await this.appointmentModel.findByPk(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.patientId !== userId) {
      throw new BadRequestException('You can only tip on your own appointments');
    }

    const transaction = await this.transactionModel.create({
      userId,
      appointmentId,
      amount: dto.amount,
      type: TransactionType.TIP,
      status: TransactionStatus.COMPLETED,
    } as Partial<Transaction>);

    const tip = await this.tipModel.create({
      appointmentId,
      patientId: userId,
      doctorId: appointment.doctorId,
      amount: dto.amount,
      transactionId: transaction.id,
    } as Partial<Tip>);

    return { tip, transaction };
  }

  async getDoctorEarnings(doctorId: number, dateFrom?: string, dateTo?: string) {
    const doctor = await this.doctorModel.findByPk(doctorId);
    if (!doctor) throw new NotFoundException('Doctor not found');

    const where: Record<string, unknown> = {
      status: TransactionStatus.COMPLETED,
    };

    const appointmentWhere: Record<string, unknown> = { doctorId };

    if (dateFrom || dateTo) {
      const dateFilter: Record<symbol, string> = {};
      if (dateFrom) dateFilter[Op.gte] = dateFrom;
      if (dateTo) dateFilter[Op.lte] = dateTo;
      where['createdAt'] = dateFilter;
    }

    const transactions = await this.transactionModel.findAll({
      where,
      include: [{
        model: Appointment,
        where: appointmentWhere,
        required: true,
      }],
    });

    const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    return { doctorId, total, transactionCount: transactions.length };
  }
}
