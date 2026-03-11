import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Doctor } from './doctor.model.js';
import { Department } from './department.model.js';

@Table({ tableName: 'doctor_departments', timestamps: true })
export class DoctorDepartment extends Model {
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

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare departmentId: number;

  @BelongsTo(() => Department)
  declare department?: Department;
}

export default DoctorDepartment;
