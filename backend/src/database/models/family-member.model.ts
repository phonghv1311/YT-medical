import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Customer } from './customer.model.js';

export enum FamilyMemberGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Table({ tableName: 'family_members', timestamps: true })
export class FamilyMember extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare customerId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare relationship: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare dateOfBirth: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(FamilyMemberGender)),
    allowNull: true,
  })
  declare gender: FamilyMemberGender | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare bloodType: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare statusNotes: string | null;

  @BelongsTo(() => Customer)
  declare customer?: Customer;
}

export default FamilyMember;
