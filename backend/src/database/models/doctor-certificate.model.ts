import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Doctor } from './doctor.model.js';

export const DOCTOR_CERTIFICATE_TYPES = ['medical_degree', 'board_certification', 'identity_proof', 'medical_license'] as const;
export type DoctorCertificateType = (typeof DOCTOR_CERTIFICATE_TYPES)[number];

export const DOCTOR_CERTIFICATE_STATUSES = ['pending', 'uploaded', 'verifying', 'verified', 'rejected'] as const;
export type DoctorCertificateStatus = (typeof DOCTOR_CERTIFICATE_STATUSES)[number];

@Table({ tableName: 'doctor_certificates', timestamps: true })
export class DoctorCertificate extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Doctor)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare doctorId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare type: DoctorCertificateType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare fileUrl: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: DoctorCertificateStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare submittedAt: Date | null;

  @BelongsTo(() => Doctor)
  declare doctor?: Doctor;
}
