import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { Staff } from '../database/models/staff.model.js';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Department } from '../database/models/department.model.js';
import { Hospital } from '../database/models/hospital.model.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Department) private readonly departmentModel: typeof Department,
    @InjectModel(Hospital) private readonly hospitalModel: typeof Hospital,
  ) { }

  private async getStaffRoleId(): Promise<number> {
    const role = await this.roleModel.findOne({ where: { name: 'staff' } });
    if (!role) throw new BadRequestException('Staff role not found');
    return role.id;
  }

  async findAll(params?: { hospitalId?: number; page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (params?.hospitalId != null) where.hospitalId = params.hospitalId;

    const { rows, count } = await this.staffModel.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar', 'isActive'] },
        { model: Department, attributes: ['id', 'name'], required: false },
        { model: Hospital, attributes: ['id', 'name'], required: false },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { staff: rows, total: count, page, limit };
  }

  async findByUserId(userId: number) {
    const staff = await this.staffModel.findOne({
      where: { userId },
      include: [
        { model: User, attributes: { exclude: ['password', 'refreshToken'] } },
        { model: Department, required: false },
        { model: Hospital, required: false },
      ],
    });
    if (!staff) throw new NotFoundException('Staff profile not found');
    return staff;
  }

  async findOne(id: number) {
    const staff = await this.staffModel.findByPk(id, {
      include: [
        { model: User, attributes: { exclude: ['password', 'refreshToken'] } },
        { model: Department, required: false },
        { model: Hospital, required: false },
      ],
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async create(dto: CreateStaffDto) {
    const roleId = await this.getStaffRoleId();
    const existing = await this.userModel.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      roleId,
    } as Partial<User>);

    const staff = await this.staffModel.create({
      userId: user.id,
      hospitalId: dto.hospitalId ?? null,
      departmentId: dto.departmentId ?? null,
      jobTitle: dto.jobTitle ?? dto.position ?? null,
      position: dto.position ?? dto.jobTitle ?? null,
      startDate: dto.startDate ?? null,
      weeklyHours: dto.weeklyHours ?? null,
      contractUrl: dto.contractUrl ?? null,
      profilePhotoUrl: dto.profilePhotoUrl ?? null,
      resumeUrl: dto.resumeUrl ?? null,
    } as Partial<Staff>);

    return this.findOne(staff.id);
  }

  async update(id: number, dto: UpdateStaffDto) {
    const staff = await this.staffModel.findByPk(id, { include: [{ model: User }] });
    if (!staff) throw new NotFoundException('Staff not found');

    if (dto.firstName != null || dto.lastName != null || dto.phone !== undefined) {
      const user = await this.userModel.findByPk(staff.userId);
      if (user) {
        if (dto.firstName != null) user.firstName = dto.firstName;
        if (dto.lastName != null) user.lastName = dto.lastName;
        if (dto.phone !== undefined) user.phone = dto.phone;
        await user.save();
      }
    }

    await staff.update({
      hospitalId: dto.hospitalId !== undefined ? dto.hospitalId : staff.hospitalId,
      departmentId: dto.departmentId !== undefined ? dto.departmentId : staff.departmentId,
      jobTitle: dto.jobTitle !== undefined ? dto.jobTitle : staff.jobTitle,
      position: dto.position !== undefined ? dto.position : staff.position,
      startDate: dto.startDate !== undefined ? dto.startDate : staff.startDate,
      weeklyHours: dto.weeklyHours !== undefined ? dto.weeklyHours : staff.weeklyHours,
      contractUrl: dto.contractUrl !== undefined ? dto.contractUrl : staff.contractUrl,
      profilePhotoUrl: dto.profilePhotoUrl !== undefined ? dto.profilePhotoUrl : staff.profilePhotoUrl,
      resumeUrl: dto.resumeUrl !== undefined ? dto.resumeUrl : staff.resumeUrl,
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const staff = await this.staffModel.findByPk(id);
    if (!staff) throw new NotFoundException('Staff not found');
    const user = await this.userModel.findByPk(staff.userId);
    if (user) await user.update({ isActive: false });
    return { message: 'Employee deactivated' };
  }
}
