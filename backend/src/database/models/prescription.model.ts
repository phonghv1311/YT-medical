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

@Table({ tableName: 'prescriptions', timestamps: true })
export class Prescription extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Appointment)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare appointmentId: number | null;

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
    type: DataType.TEXT,
    allowNull: false,
  })
  declare medications: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare fileUrl: string | null;

  @BelongsTo(() => Appointment)
  declare appointment?: Appointment;

  @BelongsTo(() => User, 'patientId')
  declare patient?: User;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;
}

export default Prescription;
