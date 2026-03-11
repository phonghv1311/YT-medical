import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Customer } from '../database/models/customer.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { DoctorDepartment } from '../database/models/doctor-department.model.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(DoctorDepartment) private readonly doctorDepartmentModel: typeof DoctorDepartment,
  ) { }

  async getProfile(userId: number) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{ model: Role }, { model: Customer, required: false }],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userModel.findByPk(userId, { include: [{ model: Customer, required: false }] });
    if (!user) throw new NotFoundException('User not found');
    const { dateOfBirth, gender, height, weight, ...userFields } = dto;
    await user.update(userFields);
    const customer = await this.customerModel.findOne({ where: { userId } });
    if (customer && (dateOfBirth !== undefined || gender !== undefined || height !== undefined || weight !== undefined)) {
      await customer.update({
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(gender !== undefined && { gender: gender as 'male' | 'female' | 'other' }),
        ...(height !== undefined && { height }),
        ...(weight !== undefined && { weight }),
      });
    }
    return this.getProfile(userId);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await user.update({ password: hashed });
    return { message: 'Password updated successfully' };
  }

  async adminResetPassword(userId: number, newPassword: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });
    return { message: 'Password reset successfully' };
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows, count } = await this.userModel.findAndCountAll({
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{ model: Role }],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { users: rows, total: count, page, limit };
  }

  async createUser(dto: CreateUserDto) {
    const role = await this.roleModel.findByPk(dto.roleId);
    if (!role) throw new BadRequestException('Invalid role');
    const hashed = await bcrypt.hash(dto.password, 10);
    const { hospitalId, departmentId, ...userFields } = dto;
    const user = await this.userModel.create({ ...userFields, password: hashed } as Partial<User>);
    if (role.name === 'doctor') {
      const doctor = await this.doctorModel.create({ userId: user.id } as Partial<Doctor>);
      if (departmentId != null) {
        await this.doctorDepartmentModel.create({ doctorId: doctor.id, departmentId });
      }
    }
    return this.getProfile(user.id);
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');
    await user.update(dto);
    return this.getProfile(id);
  }

  async deleteUser(id: number) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');
    await user.update({ isActive: false });
    return { message: 'User deactivated' };
  }
}
