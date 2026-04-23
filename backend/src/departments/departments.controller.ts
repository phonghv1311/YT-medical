import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DepartmentsService } from './departments.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles, CurrentUser } from '../common/decorators/index.js';
import { Staff } from '../database/models/staff.model.js';

@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
  ) { }

  private async resolveAdminHospitalId(adminUserId: number): Promise<number> {
    const myStaff = await this.staffModel.findOne({
      where: { userId: adminUserId },
      attributes: ['hospitalId'],
    });
    if (!myStaff?.hospitalId) throw new ForbiddenException('Access denied');
    return myStaff.hospitalId;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
    @Query('hospitalId') hospitalId?: string,
  ) {
    if (role === 'admin') {
      const adminHospitalId = await this.resolveAdminHospitalId(userId as number);
      return this.departmentsService.findAll(adminHospitalId);
    }
    return this.departmentsService.findAll(hospitalId ? +hospitalId : undefined);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    const dept = await this.departmentsService.findOne(id);
    if (role === 'admin') {
      const adminHospitalId = await this.resolveAdminHospitalId(userId as number);
      if (dept.hospitalId !== adminHospitalId) throw new ForbiddenException('Access denied');
      return dept;
    }
    return dept;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    if (role === 'admin') {
      const adminHospitalId = await this.resolveAdminHospitalId(userId);
      if (dto.hospitalId !== adminHospitalId) throw new ForbiddenException('Access denied');
    }
    return this.departmentsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    if (role === 'admin') {
      const dept = await this.departmentsService.findOne(id);
      const adminHospitalId = await this.resolveAdminHospitalId(userId);
      if (dept.hospitalId !== adminHospitalId) throw new ForbiddenException('Access denied');
    }
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    if (role === 'admin') {
      const dept = await this.departmentsService.findOne(id);
      const adminHospitalId = await this.resolveAdminHospitalId(userId);
      if (dept.hospitalId !== adminHospitalId) throw new ForbiddenException('Access denied');
    }
    return this.departmentsService.remove(id);
  }
}
