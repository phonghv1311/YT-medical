import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Doctor } from './doctor.model.js';

@Table({ tableName: 'schedules', timestamps: true })
export class Schedule extends Model {
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
    type: DataType.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 6 },
  })
  declare dayOfWeek: number;

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
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;
}

export default Schedule;
