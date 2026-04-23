import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Hospital } from './hospital.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'departments', timestamps: true })
export class Department extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @ForeignKey(() => Hospital)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare hospitalId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare headId: number | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsTo(() => Hospital)
  declare hospital?: Hospital;

  @BelongsTo(() => User, { foreignKey: 'headId', as: 'head' })
  declare head?: User;
}

export default Department;
