import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Department } from '../database/models/department.model.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import type { WhereOptions } from 'sequelize';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department) private readonly departmentModel: typeof Department,
  ) {}

  async findAll(hospitalId?: number) {
    const where: WhereOptions = { isActive: true };
    if (hospitalId) where.hospitalId = hospitalId;
    return this.departmentModel.findAll({ where, order: [['name', 'ASC']] });
  }

  async findOne(id: number) {
    const department = await this.departmentModel.findByPk(id);
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    return this.departmentModel.create(dto as Partial<Department>);
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    const department = await this.departmentModel.findByPk(id);
    if (!department) throw new NotFoundException('Department not found');
    await department.update(dto);
    return department;
  }

  async remove(id: number) {
    const department = await this.departmentModel.findByPk(id);
    if (!department) throw new NotFoundException('Department not found');
    await department.update({ isActive: false });
    return { message: 'Department deactivated' };
  }
}
