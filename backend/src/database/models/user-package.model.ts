import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Package } from './package.model.js';

@Table({ tableName: 'user_packages', timestamps: true })
export class UserPackage extends Model {
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

  @ForeignKey(() => Package)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare packageId: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare startDate: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare endDate: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  declare consultationsUsed: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsTo(() => User)
  declare user?: User;

  @BelongsTo(() => Package)
  declare pkg?: Package;
}

export default UserPackage;
