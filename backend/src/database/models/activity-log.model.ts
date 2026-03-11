import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ tableName: 'activity_logs', timestamps: true })
export class ActivityLog extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare userId: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare action: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare resource: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare resourceId: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare details: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare ipAddress: string | null;

  @BelongsTo(() => User)
  declare user?: User;
}

export default ActivityLog;
