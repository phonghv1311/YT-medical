import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MedicalRecord } from '../database/models/medical-record.model.js';
import { Prescription } from '../database/models/prescription.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { User } from '../database/models/user.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { SpacesService } from '../common/services/index.js';
import { CreateRecordDto } from './dto/create-record.dto.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectModel(MedicalRecord) private readonly medicalRecordModel: typeof MedicalRecord,
    @InjectModel(Prescription) private readonly prescriptionModel: typeof Prescription,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    private readonly spacesService: SpacesService,
  ) { }

  async uploadRecord(
    patientId: number,
    doctorId: number,
    file: Express.Multer.File,
    dto: CreateRecordDto,
  ) {
    const { key, url } = await this.spacesService.upload(file, 'medical-records');

    return this.medicalRecordModel.create({
      patientId,
      doctorId,
      title: dto.title,
      description: dto.description ?? null,
      fileUrl: url,
      fileKey: key,
      recordDate: dto.recordDate,
    } as Partial<MedicalRecord>);
  }

  async getRecords(patientId: number) {
    return this.medicalRecordModel.findAll({
      where: { patientId },
      include: [{ model: Doctor, include: [{ model: User, attributes: ['firstName', 'lastName'] }] }],
      order: [['recordDate', 'DESC']],
    });
  }

  async getRecordUrl(id: number) {
    const record = await this.medicalRecordModel.findByPk(id);
    if (!record) throw new NotFoundException('Record not found');
    if (!record.fileKey) throw new NotFoundException('No file attached to this record');

    const url = await this.spacesService.getSignedUrl(record.fileKey);
    return { url };
  }

  async createPrescription(doctorUserId: number, dto: CreatePrescriptionDto) {
    const doctor = await this.doctorModel.findOne({ where: { userId: doctorUserId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return this.prescriptionModel.create({
      appointmentId: dto.appointmentId ?? null,
      patientId: dto.patientId,
      doctorId: doctor.id,
      medications: dto.medications,
      notes: dto.notes ?? null,
    } as Partial<Prescription>);
  }

  async getPrescriptions(patientId: number) {
    return this.prescriptionModel.findAll({
      where: { patientId },
      include: [
        { model: Doctor, include: [{ model: User, attributes: ['firstName', 'lastName'] }] },
        { model: Appointment },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}
