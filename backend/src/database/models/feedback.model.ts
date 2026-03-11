import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';

export enum FeedbackStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Table({ tableName: 'feedback', timestamps: true })
export class Feedback extends Model {
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
    type: DataType.STRING,
    allowNull: false,
  })
  declare subject: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare body: string;

  @Column({
    type: DataType.ENUM(...Object.values(FeedbackStatus)),
    defaultValue: FeedbackStatus.OPEN,
    allowNull: false,
  })
  declare status: FeedbackStatus;

  @BelongsTo(() => User)
  declare user?: User;
}

export default Feedback;
