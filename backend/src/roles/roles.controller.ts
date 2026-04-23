import {
  Controller, Get, Put, Body, Param, UseGuards, ParseIntPipe, Post, Delete,
} from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { UpdatePermissionsDto } from './dto/update-permissions.dto.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles } from '../common/decorators/index.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  findAll() {
    return this.rolesService.findAll();
  }

  @Put(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.rolesService.updatePermissions(id, dto.permissionIds);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto.name, dto.permissionIds ?? []);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }
}
