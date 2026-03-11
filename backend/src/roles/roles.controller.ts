import {
  Controller, Get, Put, Body, Param, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { UpdatePermissionsDto } from './dto/update-permissions.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles } from '../common/decorators/index.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

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
}
