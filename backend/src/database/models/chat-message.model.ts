import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Appointment } from './appointment.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'chat_messages', timestamps: true })
export class ChatMessage extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Appointment)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare appointmentId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare senderId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;

  @BelongsTo(() => Appointment)
  declare appointment?: Appointment;

  @BelongsTo(() => User, 'senderId')
  declare sender?: User;
}

export default ChatMessage;
