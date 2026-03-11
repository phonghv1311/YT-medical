import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { Role } from './role.model.js';
import { RolePermission } from './role-permission.model.js';

@Table({ tableName: 'permissions', timestamps: true })
export class Permission extends Model {
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

  @BelongsToMany(() => Role, () => RolePermission)
  declare roles?: Role[];
}
