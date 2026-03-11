import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Department } from './department.model.js';
import { Hospital } from './hospital.model.js';

@Table({ tableName: 'staff', timestamps: true })
export class Staff extends Model {
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
    type: DataType.STRING,
    allowNull: true,
  })
  declare position: string | null;

  @ForeignKey(() => Hospital)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare hospitalId: number | null;

  @ForeignKey(() => Department)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare departmentId: number | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare startDate: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare weeklyHours: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare jobTitle: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare contractUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare profilePhotoUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare resumeUrl: string | null;

  @BelongsTo(() => User)
  declare user?: User;

  @BelongsTo(() => Department)
  declare department?: Department;

  @BelongsTo(() => Hospital)
  declare hospital?: Hospital;
}
