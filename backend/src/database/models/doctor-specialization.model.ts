import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Doctor } from './doctor.model.js';
import { Specialization } from './specialization.model.js';

@Table({ tableName: 'doctor_specializations', timestamps: true })
export class DoctorSpecialization extends Model {
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

  @ForeignKey(() => Specialization)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare specializationId: number;
}

export default DoctorSpecialization;
