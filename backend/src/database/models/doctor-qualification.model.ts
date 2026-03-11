import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Doctor } from './doctor.model.js';

@Table({ tableName: 'doctor_qualifications', timestamps: true })
export class DoctorQualification extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Doctor)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare doctorId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare qualification: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare institution: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare year: number | null;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;
}

export default DoctorQualification;
