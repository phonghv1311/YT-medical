import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { Doctor } from './doctor.model.js';
import { DoctorSpecialization } from './doctor-specialization.model.js';

@Table({ tableName: 'specializations', timestamps: true })
export class Specialization extends Model {
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
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @BelongsToMany(() => Doctor, () => DoctorSpecialization)
  declare doctors?: Doctor[];
}

export default Specialization;
