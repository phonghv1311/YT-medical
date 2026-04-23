import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { Staff } from '../database/models/staff.model.js';
import { Hospital } from '../database/models/hospital.model.js';
import { Transaction, TransactionStatus, TransactionType } from '../database/models/transaction.model.js';

type Metric = { total: number; thisMonth: number; lastMonth: number; changePct: number };
type SeriesPoint = { date: string; value: number };

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}

function pctChange(thisMonth: number, lastMonth: number) {
  if (!lastMonth) return thisMonth ? 100 : 0;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10; // 1 decimal
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectModel(Hospital) private readonly hospitalModel: typeof Hospital,
    @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
  ) {}

  private async getRoleIds() {
    const roles = await this.roleModel.findAll({ attributes: ['id', 'name'] });
    const byName = new Map(roles.map((r) => [r.name, r.id]));
    return {
      admin: byName.get('admin'),
      superadmin: byName.get('superadmin'),
      customer: byName.get('customer'),
    };
  }

  async getSuperadminDashboard() {
    const now = new Date();
    const thisM = monthRange(now);
    const lastM = monthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const roleIds = await this.getRoleIds();

    const [totalHospitals, hospitalsThisMonth, hospitalsLastMonth] = await Promise.all([
      this.hospitalModel.count().then((v) => Number(v) || 0),
      this.hospitalModel.count({ where: { createdAt: { [Op.gte]: thisM.start, [Op.lt]: thisM.end } } as any }).then((v) => Number(v) || 0),
      this.hospitalModel.count({ where: { createdAt: { [Op.gte]: lastM.start, [Op.lt]: lastM.end } } as any }).then((v) => Number(v) || 0),
    ]);

    const [totalDoctors, doctorsThisMonth, doctorsLastMonth] = await Promise.all([
      this.doctorModel.count().then((v) => Number(v) || 0),
      this.doctorModel.count({ where: { createdAt: { [Op.gte]: thisM.start, [Op.lt]: thisM.end } } as any }).then((v) => Number(v) || 0),
      this.doctorModel.count({ where: { createdAt: { [Op.gte]: lastM.start, [Op.lt]: lastM.end } } as any }).then((v) => Number(v) || 0),
    ]);

    const [totalStaff, staffThisMonth, staffLastMonth] = await Promise.all([
      this.staffModel.count().then((v) => Number(v) || 0),
      this.staffModel.count({ where: { createdAt: { [Op.gte]: thisM.start, [Op.lt]: thisM.end } } as any }).then((v) => Number(v) || 0),
      this.staffModel.count({ where: { createdAt: { [Op.gte]: lastM.start, [Op.lt]: lastM.end } } as any }).then((v) => Number(v) || 0),
    ]);

    const adminRoleIds = [roleIds.admin, roleIds.superadmin].filter((v): v is number => typeof v === 'number');
    const [totalAdmins, adminsThisMonth, adminsLastMonth] = await Promise.all([
      adminRoleIds.length
        ? this.userModel.count({ where: { roleId: { [Op.in]: adminRoleIds } } as any }).then((v) => Number(v) || 0)
        : Promise.resolve(0),
      adminRoleIds.length
        ? this.userModel.count({
          where: { roleId: { [Op.in]: adminRoleIds }, createdAt: { [Op.gte]: thisM.start, [Op.lt]: thisM.end } } as any,
        }).then((v) => Number(v) || 0)
        : Promise.resolve(0),
      adminRoleIds.length
        ? this.userModel.count({
          where: { roleId: { [Op.in]: adminRoleIds }, createdAt: { [Op.gte]: lastM.start, [Op.lt]: lastM.end } } as any,
        }).then((v) => Number(v) || 0)
        : Promise.resolve(0),
    ]);

    const [totalPatients, patientsThisMonth, patientsLastMonth] = await Promise.all([
      roleIds.customer ? this.userModel.count({ where: { roleId: roleIds.customer } as any }).then((v) => Number(v) || 0) : Promise.resolve(0),
      roleIds.customer
        ? this.userModel.count({
          where: { roleId: roleIds.customer, createdAt: { [Op.gte]: thisM.start, [Op.lt]: thisM.end } } as any,
        }).then((v) => Number(v) || 0)
        : Promise.resolve(0),
      roleIds.customer
        ? this.userModel.count({
          where: { roleId: roleIds.customer, createdAt: { [Op.gte]: lastM.start, [Op.lt]: lastM.end } } as any,
        }).then((v) => Number(v) || 0)
        : Promise.resolve(0),
    ]);

    const metrics: Record<string, Metric> = {
      doctors: { total: totalDoctors, thisMonth: doctorsThisMonth, lastMonth: doctorsLastMonth, changePct: pctChange(doctorsThisMonth, doctorsLastMonth) },
      patients: { total: totalPatients, thisMonth: patientsThisMonth, lastMonth: patientsLastMonth, changePct: pctChange(patientsThisMonth, patientsLastMonth) },
      staff: { total: totalStaff, thisMonth: staffThisMonth, lastMonth: staffLastMonth, changePct: pctChange(staffThisMonth, staffLastMonth) },
      admins: { total: totalAdmins, thisMonth: adminsThisMonth, lastMonth: adminsLastMonth, changePct: pctChange(adminsThisMonth, adminsLastMonth) },
      hospitals: { total: totalHospitals, thisMonth: hospitalsThisMonth, lastMonth: hospitalsLastMonth, changePct: pctChange(hospitalsThisMonth, hospitalsLastMonth) },
    };

    // Cashflow: completed transactions, refunds as negative.
    const monthTxWhere = {
      createdAt: { [Op.gte]: thisM.start, [Op.lt]: thisM.end },
      status: TransactionStatus.COMPLETED,
    } as any;
    const lastMonthTxWhere = {
      createdAt: { [Op.gte]: lastM.start, [Op.lt]: lastM.end },
      status: TransactionStatus.COMPLETED,
    } as any;

    const sumExpr = literal("SUM(CASE WHEN `type` = 'refund' THEN -`amount` ELSE `amount` END)");

    const [revThis, revLast] = await Promise.all([
      this.transactionModel.findAll({ attributes: [[sumExpr, 'value']], where: monthTxWhere, raw: true }),
      this.transactionModel.findAll({ attributes: [[sumExpr, 'value']], where: lastMonthTxWhere, raw: true }),
    ]);
    const revenueThisMonth = Number((revThis?.[0] as any)?.value ?? 0) || 0;
    const revenueLastMonth = Number((revLast?.[0] as any)?.value ?? 0) || 0;

    // Daily series for current month (up to today)
    const dailyRows = await this.transactionModel.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [sumExpr, 'value'],
      ],
      where: monthTxWhere,
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });
    const dailySeries: SeriesPoint[] = (dailyRows as any[]).map((r) => ({
      date: String(r.date),
      value: Number(r.value ?? 0) || 0,
    }));

    // Revenue by type for current month
    const byTypeRows = await this.transactionModel.findAll({
      attributes: ['type', [fn('SUM', col('amount')), 'value']],
      where: { ...monthTxWhere, type: { [Op.ne]: TransactionType.REFUND } } as any,
      group: ['type'],
      raw: true,
    });

    const revenueByType = (byTypeRows as any[]).reduce<Record<string, number>>((acc, r) => {
      acc[String(r.type)] = Number(r.value ?? 0) || 0;
      return acc;
    }, {});

    return {
      metrics,
      cashflow: {
        revenueThisMonth,
        revenueLastMonth,
        changePct: pctChange(revenueThisMonth, revenueLastMonth),
        dailySeries,
        revenueByType,
      },
    };
  }
}

