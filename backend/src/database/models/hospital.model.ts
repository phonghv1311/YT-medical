import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Department } from './department.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'hospitals', timestamps: true })
export class Hospital extends Model {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare address: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare email: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  declare isActive: boolean;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare operatingDate: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare operatingHours: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare headId: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare recordsUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare contractUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare backgroundImageUrl: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare website: string | null;

  @BelongsTo(() => User, { foreignKey: 'headId', as: 'head' })
  declare head?: User;

  @HasMany(() => Department)
  declare departments?: Department[];
}

export default Hospital;
