import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  VNPAY = 'vnpay',
}

@Table({ tableName: 'payment_methods', timestamps: true })
export class PaymentMethod extends Model {
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

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethodType)),
    allowNull: false,
  })
  declare type: PaymentMethodType;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare provider: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare providerCustomerId: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare last4: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  declare isDefault: boolean;

  @BelongsTo(() => User)
  declare user?: User;
}

export default PaymentMethod;
