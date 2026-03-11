import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Appointment } from './appointment.model.js';
import { User } from './user.model.js';
import { Doctor } from './doctor.model.js';
import { Transaction } from './transaction.model.js';

@Table({ tableName: 'tips', timestamps: true })
export class Tip extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Appointment)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare appointmentId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare patientId: number;

  @ForeignKey(() => Doctor)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare doctorId: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare amount: number;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare transactionId: number | null;

  @BelongsTo(() => Appointment)
  declare appointment?: Appointment;

  @BelongsTo(() => User, 'patientId')
  declare patient?: User;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;
}

export default Tip;
