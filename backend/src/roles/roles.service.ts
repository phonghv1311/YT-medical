import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../database/models/role.model.js';
import { Permission } from '../database/models/permission.model.js';
import { RolePermission } from '../database/models/role-permission.model.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Permission) private readonly permissionModel: typeof Permission,
    @InjectModel(RolePermission) private readonly rolePermissionModel: typeof RolePermission,
  ) { }

  async findAll() {
    return this.roleModel.findAll({
      include: [{ model: Permission }],
    });
  }

  async updatePermissions(roleId: number, permissionIds: number[]) {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    await this.rolePermissionModel.destroy({ where: { roleId } });

    if (permissionIds.length > 0) {
      const records = permissionIds.map((permissionId) => ({ roleId, permissionId }));
      await this.rolePermissionModel.bulkCreate(records as Partial<RolePermission>[]);
    }

    return this.roleModel.findByPk(roleId, {
      include: [{ model: Permission }],
    });
  }

  async createRole(name: string, permissionIds: number[]) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('Role name is required');

    // Ensure uniqueness.
    const existing = await this.roleModel.findOne({ where: { name: trimmed } });
    if (existing) throw new BadRequestException('Role already exists');

    if (permissionIds.length > 0) {
      const perms = await this.permissionModel.findAll({ where: { id: permissionIds } });
      const foundIds = new Set(perms.map((p) => p.id));
      const missing = permissionIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) throw new BadRequestException('Invalid permissionIds');
    }

    const role = await this.roleModel.create({ name: trimmed });

    if (permissionIds.length > 0) {
      await this.rolePermissionModel.bulkCreate(
        permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })) as Partial<RolePermission>[],
      );
    }

    return this.roleModel.findByPk(role.id, { include: [{ model: Permission }] });
  }

  async deleteRole(id: number) {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');

    // These roles are required by the app flow/seed data.
    if (['superadmin', 'admin', 'doctor', 'staff', 'customer'].includes(role.name)) {
      throw new BadRequestException(`Cannot delete built-in role: ${role.name}`);
    }

    await this.rolePermissionModel.destroy({ where: { roleId: id } });
    await role.destroy();
    return { success: true };
  }
}
