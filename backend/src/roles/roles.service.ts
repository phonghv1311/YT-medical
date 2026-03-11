import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

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
}
