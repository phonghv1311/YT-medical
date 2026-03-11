import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Doctor } from './doctor.model.js';
import { AvailabilitySlot } from './availability-slot.model.js';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AppointmentType {
  VIDEO = 'video',
  IN_PERSON = 'in_person',
}

@Table({ tableName: 'appointments', timestamps: true })
export class Appointment extends Model {
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
  declare patientId: number;

  @ForeignKey(() => Doctor)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare doctorId: number;

  @ForeignKey(() => AvailabilitySlot)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare slotId: number | null;

  @Column({
    type: DataType.ENUM(...Object.values(AppointmentStatus)),
    defaultValue: AppointmentStatus.PENDING,
    allowNull: false,
  })
  declare status: AppointmentStatus;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare scheduledAt: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare startTime: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare endTime: string;

  @Column({
    type: DataType.ENUM(...Object.values(AppointmentType)),
    defaultValue: AppointmentType.VIDEO,
    allowNull: false,
  })
  declare type: AppointmentType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare cancelReason: string | null;

  @BelongsTo(() => User, 'patientId')
  declare patient?: User;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;

  @BelongsTo(() => AvailabilitySlot)
  declare slot?: AvailabilitySlot;
}

export default Appointment;
