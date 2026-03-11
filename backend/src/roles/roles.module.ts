import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';
import { Role } from '../database/models/role.model.js';
import { Permission } from '../database/models/permission.model.js';
import { RolePermission } from '../database/models/role-permission.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Role, Permission, RolePermission])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
