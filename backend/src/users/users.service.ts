import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../database/models/user.model.js';
import { Role } from '../database/models/role.model.js';
import { Customer } from '../database/models/customer.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { DoctorDepartment } from '../database/models/doctor-department.model.js';
import { Staff } from '../database/models/staff.model.js';
import { Hospital } from '../database/models/hospital.model.js';
import { Department } from '../database/models/department.model.js';
import { DoctorSpecialization } from '../database/models/doctor-specialization.model.js';
import { Specialization } from '../database/models/specialization.model.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { DeactivateUserDto } from './dto/deactivate-user.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { LogsService } from '../logs/logs.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(DoctorDepartment) private readonly doctorDepartmentModel: typeof DoctorDepartment,
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectModel(DoctorSpecialization) private readonly doctorSpecializationModel: typeof DoctorSpecialization,
    @InjectModel(Department) private readonly departmentModel: typeof Department,
    private readonly notificationsService: NotificationsService,
    private readonly logsService: LogsService,
  ) { }

  /**
   * Resolve hospitalId for hospital-scoped admin users.
   * Admin must have a Staff record to link to a hospital.
   */
  private async resolveAdminHospitalId(adminUserId: number): Promise<number> {
    const adminStaff = await this.staffModel.findOne({
      where: { userId: adminUserId },
      attributes: ['hospitalId'],
    });

    if (!adminStaff?.hospitalId) {
      throw new ForbiddenException('Admin is not linked to a hospital');
    }

    return adminStaff.hospitalId;
  }

  async assertUserInHospitalScope(targetUserId: number, adminUserId: number) {
    const hospitalId = await this.resolveAdminHospitalId(adminUserId);

    // Staff users
    const staffMatch = await this.staffModel.findOne({
      where: { userId: targetUserId, hospitalId },
      attributes: ['id'],
    });
    if (staffMatch) return;

    // Doctor users via doctor_departments -> departments.hospitalId
    const doctorMatch = await this.doctorModel.findOne({
      where: { userId: targetUserId },
      include: [
        {
          model: DoctorDepartment,
          required: true,
          include: [
            {
              model: Department,
              required: true,
              where: { hospitalId },
            },
          ],
        },
      ],
      attributes: ['id'],
    });

    if (!doctorMatch) {
      throw new ForbiddenException('Access denied');
    }
  }

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

  async findAll(
    page = 1,
    limit = 20,
    scope?: { requesterRole?: string; requesterId?: number },
  ) {
    const offset = (page - 1) * limit;

    const requesterRole = scope?.requesterRole ?? '';
    const requesterId = scope?.requesterId;
    const isHospitalAdmin = requesterRole === 'admin' && requesterId != null;

    // Superadmin: return full dataset (legacy behavior)
    if (!isHospitalAdmin) {
      const { rows, count } = await this.userModel.findAndCountAll({
        attributes: { exclude: ['password', 'refreshToken'] },
        include: [
          { model: Role, required: true, where: { name: { [Op.ne]: 'superadmin' } } },
          { model: Customer, required: false, attributes: ['dateOfBirth'] },
          {
            model: Staff,
            required: false,
            attributes: ['position', 'hospitalId', 'departmentId'],
            include: [{ model: Hospital, attributes: ['id', 'name'] }],
          },
          {
            model: Doctor,
            required: false,
            include: [
              {
                model: DoctorDepartment,
                include: [
                  { model: Department, include: [{ model: Hospital, attributes: ['id', 'name'] }] },
                ],
              },
              // Include specializations to render "khoa" in admin users list.
              { model: Specialization, through: { attributes: [] }, attributes: ['id', 'name'] },
            ],
          },
        ],
        offset,
        limit,
        order: [['createdAt', 'DESC']],
      });
      return { users: rows, total: count, page, limit };
    }

    const adminHospitalId = await this.resolveAdminHospitalId(requesterId as number);

    // Hospital-scoped admin: union "staff users" + "doctor users" and slice in memory.
    // This avoids complicated OR filtering on multiple associations.
    const [staffUsers, doctorUsers] = await Promise.all([
      this.userModel.findAll({
        attributes: { exclude: ['password', 'refreshToken'] },
        include: [
          { model: Role, required: true, where: { name: { [Op.ne]: 'superadmin' } } },
          { model: Customer, required: false, attributes: ['dateOfBirth'] },
          {
            model: Staff,
            required: true,
            attributes: ['position', 'hospitalId', 'departmentId', 'startDate'],
            where: { hospitalId: adminHospitalId },
            include: [
              { model: Hospital, attributes: ['id', 'name'] },
              { model: Department, attributes: ['id', 'name'], required: false },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
      this.userModel.findAll({
        attributes: { exclude: ['password', 'refreshToken'] },
        include: [
          { model: Role, required: true, where: { name: { [Op.ne]: 'superadmin' } } },
          { model: Customer, required: false, attributes: ['dateOfBirth'] },
          {
            model: Doctor,
            required: true,
            include: [
              {
                model: DoctorDepartment,
                required: true,
                include: [
                  {
                    model: Department,
                    required: true,
                    where: { hospitalId: adminHospitalId, isActive: true },
                    include: [{ model: Hospital, attributes: ['id', 'name'] }],
                  },
                ],
              },
              { model: Specialization, through: { attributes: [] }, attributes: ['id', 'name'] },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const merged = new Map<number, any>();
    for (const u of [...staffUsers, ...doctorUsers]) merged.set(u.id, u);

    const users = Array.from(merged.values()).sort((a: any, b: any) =>
      String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
    );

    return {
      users: users.slice(offset, offset + limit),
      total: users.length,
      page,
      limit,
    };
  }

  async createUser(
    dto: CreateUserDto,
    scope?: { requesterRole?: string; requesterId?: number },
  ) {
    const role = await this.roleModel.findByPk(dto.roleId);
    if (!role) throw new BadRequestException('Invalid role');

    const requesterRole = scope?.requesterRole ?? '';
    const requesterId = scope?.requesterId;
    const isHospitalAdmin = requesterRole === 'admin' && requesterId != null;

    if (isHospitalAdmin && role.name !== 'doctor') {
      throw new ForbiddenException('Hospital admin can only create doctors via users endpoint');
    }

    if (isHospitalAdmin && role.name === 'doctor' && dto.departmentId != null) {
      const adminHospitalId = await this.resolveAdminHospitalId(requesterId as number);
      const department = await this.departmentModel.findByPk(dto.departmentId);
      if (!department || department.hospitalId !== adminHospitalId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const { hospitalId, departmentId, specializationIds, ...userFields } = dto;
    const user = await this.userModel.create({ ...userFields, password: hashed } as Partial<User>);

    if (role.name === 'doctor') {
      const doctor = await this.doctorModel.create({ userId: user.id } as Partial<Doctor>);
      if (departmentId != null) {
        await this.doctorDepartmentModel.create({ doctorId: doctor.id, departmentId });
      }

      if (specializationIds && specializationIds.length > 0) {
        await this.doctorSpecializationModel.bulkCreate(
          specializationIds.map((specializationId) => ({
            doctorId: doctor.id,
            specializationId,
          })),
        );
      }
    }

    // When superadmin creates a "hospital admin" user, we also create staff record
    // so that this admin can be hospital-scoped for other resources.
    if (role.name === 'admin') {
      await this.staffModel.create({
        userId: user.id,
        hospitalId: hospitalId ?? null,
        departmentId: departmentId ?? null,
        position: null,
        jobTitle: null,
        startDate: null,
        weeklyHours: null,
        contractUrl: null,
        profilePhotoUrl: null,
        resumeUrl: null,
      } as Partial<Staff>);
    }
    return this.getProfile(user.id);
  }

  async updateUser(id: number, dto: UpdateUserDto, performedByUserId?: number) {
    const user = await this.userModel.findByPk(id, { include: [Role, Customer, Doctor] });
    if (!user) throw new NotFoundException('User not found');

    // When reactivating, clear deactivation metadata
    const updates: Partial<User> = { ...dto } as Partial<User>;
    delete (updates as UpdateUserDto & { reason?: string }).reason;
    if (dto.isActive === true) {
      updates.deactivatedReason = null;
      updates.deactivatedAt = null;
    }

    // Prevent admins/superadmins from mutating personal data of doctors or customers here.
    const roleName = user.role?.name;
    if (roleName === 'doctor' || roleName === 'customer') {
      const allowed: Partial<UpdateUserDto> = {};
      if (dto.isActive !== undefined) allowed.isActive = dto.isActive;
      if (Object.keys(allowed).length === 0) {
        return this.getProfile(id);
      }
      await user.update({ ...allowed, ...(allowed.isActive === true ? { deactivatedReason: null, deactivatedAt: null } : {}) } as Partial<User>);
      if (dto.isActive !== undefined && performedByUserId != null) {
        const action = dto.isActive ? 'activate' : 'deactivate';
        const reason = dto.reason ?? '';
        await this.logsService.log(performedByUserId, action, 'user', id, JSON.stringify({ reason }), undefined, reason);
      }
      return this.getProfile(id);
    }

    if (roleName === 'superadmin' && dto.roleId !== undefined) {
      delete updates.roleId;
    }

    await user.update(updates);
    if (dto.isActive !== undefined && performedByUserId != null) {
      const action = dto.isActive ? 'activate' : 'deactivate';
      const reason = dto.reason ?? '';
      await this.logsService.log(performedByUserId, action, 'user', id, JSON.stringify({ reason }), undefined, reason);
    }
    return this.getProfile(id);
  }

  async deactivateUser(id: number, dto: DeactivateUserDto, performedByUserId: number) {
    const user = await this.userModel.findByPk(id, { include: [Role] });
    if (!user) throw new NotFoundException('User not found');
    if ((user as { role?: { name?: string } }).role?.name === 'superadmin') {
      throw new ForbiddenException('Cannot deactivate superadmin user');
    }
    const now = new Date();
    await user.update({
      isActive: false,
      deactivatedReason: dto.reason,
      deactivatedAt: now,
    });

    await this.logsService.log(
      performedByUserId,
      'deactivate',
      'user',
      id,
      JSON.stringify({ reason: dto.reason }),
      undefined,
      dto.reason,
    );

    const title = 'Account deactivated';
    const body = `Your account has been deactivated. Reason: ${dto.reason}. If you have questions, please contact support.`;

    await this.notificationsService.create(id, 'system', title, body);

    if (user.email) {
      // await this.mailerService.sendDeactivationEmail(user.email, { fullName, reason: dto.reason });
    }
    if (user.phone) {
      // await this.smsService.sendDeactivationSms(user.phone, { fullName, reason: dto.reason });
    }

    return { message: 'User deactivated and notified' };
  }

  async deleteUser(id: number, reason: string | undefined, performedByUserId: number) {
    const user = await this.userModel.findByPk(id, { include: [Role] });
    if (!user) throw new NotFoundException('User not found');
    if ((user as { role?: { name?: string } }).role?.name === 'superadmin') {
      throw new ForbiddenException('Cannot delete superadmin user');
    }
    await user.update({ isActive: false });

    await this.logsService.log(
      performedByUserId,
      'delete',
      'user',
      id,
      JSON.stringify({ reason: reason ?? 'No reason provided' }),
      undefined,
      reason ?? 'No reason provided',
    );

    return { message: 'User deactivated' };
  }
}
