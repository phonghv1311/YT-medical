import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Permission } from './permission.model.js';
import { RolePermission } from './role-permission.model.js';

@Table({ tableName: 'roles', timestamps: true })
export class Role extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare description: string | null;

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions?: Permission[];
}
