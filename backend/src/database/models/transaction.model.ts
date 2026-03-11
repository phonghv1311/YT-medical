import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Appointment } from './appointment.model.js';
import { Package } from './package.model.js';
import { PaymentMethod } from './payment-method.model.js';

export enum TransactionType {
  CONSULTATION = 'consultation',
  PACKAGE = 'package',
  TIP = 'tip',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Table({ tableName: 'transactions', timestamps: true })
export class Transaction extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @ForeignKey(() => Appointment)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare appointmentId: number | null;

  @ForeignKey(() => Package)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare packageId: number | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionType)),
    allowNull: false,
  })
  declare type: TransactionType;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionStatus)),
    defaultValue: TransactionStatus.PENDING,
    allowNull: false,
  })
  declare status: TransactionStatus;

  @ForeignKey(() => PaymentMethod)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare paymentMethodId: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare providerTransactionId: string | null;

  @BelongsTo(() => User)
  declare user?: User;

  @BelongsTo(() => Appointment)
  declare appointment?: Appointment;

  @BelongsTo(() => Package)
  declare pkg?: Package;

  @BelongsTo(() => PaymentMethod)
  declare paymentMethod?: PaymentMethod;
}

export default Transaction;
