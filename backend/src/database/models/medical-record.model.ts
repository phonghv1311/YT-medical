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

@Table({ tableName: 'medical_records', timestamps: true })
export class MedicalRecord extends Model {
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
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare fileUrl: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare fileKey: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare recordDate: string;

  @BelongsTo(() => User, 'patientId')
  declare patient?: User;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;
}

export default MedicalRecord;
