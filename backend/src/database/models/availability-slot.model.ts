import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Doctor } from './doctor.model.js';

@Table({ tableName: 'availability_slots', timestamps: true })
export class AvailabilitySlot extends Model {
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
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare date: string;

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
    defaultValue: false,
    allowNull: false,
  })
  declare isBooked: boolean;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;
}

export default AvailabilitySlot;
