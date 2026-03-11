import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Table({ tableName: 'customers', timestamps: true })
export class Customer extends Model {
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
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare dateOfBirth: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(Gender)),
    allowNull: true,
  })
  declare gender: Gender | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare address: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare height: number | null;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  declare weight: number | null;

  @BelongsTo(() => User)
  declare user?: User;
}
