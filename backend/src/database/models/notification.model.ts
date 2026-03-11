import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';

export enum NotificationType {
  APPOINTMENT = 'appointment',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  CHAT = 'chat',
}

@Table({ tableName: 'notifications', timestamps: true })
export class Notification extends Model {
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
  declare userId: number;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationType)),
    allowNull: false,
  })
  declare type: NotificationType;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare body: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare readAt: Date | null;

  @BelongsTo(() => User)
  declare user?: User;
}

export default Notification;
