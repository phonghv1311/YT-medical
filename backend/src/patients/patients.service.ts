import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../database/models/user.model.js';
import { Customer } from '../database/models/customer.model.js';
import { FamilyMember } from '../database/models/family-member.model.js';
import { MedicalRecord } from '../database/models/medical-record.model.js';
import { PatientStatus } from '../database/models/patient-status.model.js';
import { Role } from '../database/models/role.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto.js';
import { UpdatePatientStatusDto } from './dto/update-patient-status.dto.js';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(FamilyMember) private readonly familyMemberModel: typeof FamilyMember,
    @InjectModel(MedicalRecord) private readonly medicalRecordModel: typeof MedicalRecord,
    @InjectModel(PatientStatus) private readonly patientStatusModel: typeof PatientStatus,
  ) { }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows, count } = await this.userModel.findAndCountAll({
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, where: { name: 'customer' } },
        { model: Customer },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { patients: rows, total: count, page, limit };
  }

  async getRecords(patientId: number) {
    const records = await this.medicalRecordModel.findAll({
      where: { patientId },
      include: [{ model: Doctor, include: [{ model: User, attributes: ['firstName', 'lastName'] }] }],
      order: [['recordDate', 'DESC']],
    });
    return records;
  }

  async createRecord(
    patientId: number,
    doctorId: number,
    dto: { title: string; description?: string; fileUrl?: string; fileKey?: string; recordDate: string },
  ) {
    const patient = await this.userModel.findByPk(patientId);
    if (!patient) throw new NotFoundException('Patient not found');

    return this.medicalRecordModel.create({
      patientId,
      doctorId,
      title: dto.title,
      description: dto.description ?? null,
      fileUrl: dto.fileUrl ?? null,
      fileKey: dto.fileKey ?? null,
      recordDate: dto.recordDate,
    } as Partial<MedicalRecord>);
  }

  async getStatus(patientId: number) {
    return this.patientStatusModel.findAll({
      where: { patientId },
      include: [{ model: Doctor, include: [{ model: User, attributes: ['firstName', 'lastName'] }] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async updateStatus(patientId: number, doctorId: number, dto: UpdatePatientStatusDto) {
    const patient = await this.userModel.findByPk(patientId);
    if (!patient) throw new NotFoundException('Patient not found');

    return this.patientStatusModel.create({
      patientId,
      doctorId,
      status: dto.status,
      notes: dto.notes ?? null,
    } as Partial<PatientStatus>);
  }

  async getFamilyMembers(customerId: number) {
    return this.familyMemberModel.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']],
    });
  }

  async addFamilyMember(customerId: number, dto: CreateFamilyMemberDto) {
    const customer = await this.customerModel.findByPk(customerId);
    if (!customer) throw new NotFoundException('Customer not found');

    return this.familyMemberModel.create({
      customerId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      relationship: dto.relationship,
      dateOfBirth: dto.dateOfBirth ?? null,
      gender: dto.gender ?? null,
    } as Partial<FamilyMember>);
  }

  async getFamilyMembersByUserId(userId: number) {
    const customer = await this.customerModel.findOne({ where: { userId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.getFamilyMembers(customer.id);
  }

  async addFamilyMemberByUserId(userId: number, dto: CreateFamilyMemberDto) {
    const customer = await this.customerModel.findOne({ where: { userId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.addFamilyMember(customer.id, dto);
  }
}
