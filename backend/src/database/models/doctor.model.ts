import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { DoctorQualification } from './doctor-qualification.model.js';
import { DoctorDepartment } from './doctor-department.model.js';
import { Specialization } from './specialization.model.js';
import { DoctorSpecialization } from './doctor-specialization.model.js';
import { Schedule } from './schedule.model.js';
import { AvailabilitySlot } from './availability-slot.model.js';
import { Appointment } from './appointment.model.js';
import { Review } from './review.model.js';

@Table({ tableName: 'doctors', timestamps: true })
export class Doctor extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    unique: true,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare bio: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare licenseNumber: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare yearsOfExperience: number | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare consultationFee: number | null;

  @Column({
    type: DataType.DECIMAL(3, 2),
    defaultValue: 0,
    allowNull: false,
  })
  declare averageRating: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  declare totalReviews: number;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare startDate: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare expertise: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare recordsUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare contractUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare backgroundImageUrl: string | null;

  @BelongsTo(() => User)
  declare user?: User;

  @HasMany(() => DoctorQualification)
  declare qualifications?: DoctorQualification[];

  @HasMany(() => DoctorDepartment)
  declare doctorDepartments?: DoctorDepartment[];

  @BelongsToMany(() => Specialization, () => DoctorSpecialization)
  declare specializations?: Specialization[];

  @HasMany(() => Schedule)
  declare schedules?: Schedule[];

  @HasMany(() => AvailabilitySlot)
  declare availabilitySlots?: AvailabilitySlot[];

  @HasMany(() => Appointment)
  declare appointments?: Appointment[];

  @HasMany(() => Review)
  declare reviews?: Review[];
}
