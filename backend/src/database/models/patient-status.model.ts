import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Doctor } from './doctor.model.js';

@Table({ tableName: 'patient_status', timestamps: true })
export class PatientStatus extends Model {
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
    allowNull: true,
  })
  declare doctorId: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @BelongsTo(() => User, 'patientId')
  declare patient?: User;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;
}

export default PatientStatus;
