import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Hospital } from '../database/models/hospital.model.js';
import { Department } from '../database/models/department.model.js';
import { User } from '../database/models/user.model.js';
import { Doctor } from '../database/models/doctor.model.js';
import { DoctorDepartment } from '../database/models/doctor-department.model.js';
import { Staff } from '../database/models/staff.model.js';
import { Appointment } from '../database/models/appointment.model.js';
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';
import { DeactivateHospitalDto } from './dto/deactivate-hospital.dto.js';
import { LogsService } from '../logs/logs.service.js';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectModel(Hospital) private readonly hospitalModel: typeof Hospital,
    @InjectModel(Department) private readonly departmentModel: typeof Department,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(DoctorDepartment) private readonly doctorDepartmentModel: typeof DoctorDepartment,
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectModel(Appointment) private readonly appointmentModel: typeof Appointment,
    private readonly logsService: LogsService,
  ) { }

  async findAll() {
    // Return all hospitals (active + paused) with basic stats for list UI.
    // Note: use SQL subqueries to avoid heavy joins.
    return this.hospitalModel.findAll({
      include: [
        { model: User, as: 'head', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      ],
      attributes: {
        include: [
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM `departments` WHERE `departments`.`hospitalId` = `Hospital`.`id` AND `departments`.`isActive` = true)',
            ),
            'departmentCount',
          ],
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM `staff` WHERE `staff`.`hospitalId` = `Hospital`.`id`)',
            ),
            'staffCount',
          ],
          [
            Sequelize.literal(
              '(SELECT COUNT(DISTINCT `dd`.`doctorId`) FROM `doctor_departments` AS `dd` JOIN `departments` AS `dep` ON `dep`.`id` = `dd`.`departmentId` WHERE `dep`.`hospitalId` = `Hospital`.`id` AND `dep`.`isActive` = true)',
            ),
            'doctorCount',
          ],
          [
            Sequelize.literal(
              '(SELECT COUNT(DISTINCT `a`.`patientId`) FROM `appointments` AS `a` WHERE `a`.`doctorId` IN (SELECT DISTINCT `dd2`.`doctorId` FROM `doctor_departments` AS `dd2` JOIN `departments` AS `dep2` ON `dep2`.`id` = `dd2`.`departmentId` WHERE `dep2`.`hospitalId` = `Hospital`.`id` AND `dep2`.`isActive` = true))',
            ),
            'patientCount',
          ],
        ],
      },
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: number) {
    const hospital = await this.hospitalModel.findByPk(id, {
      include: [
        { model: Department, where: { isActive: true }, required: false },
        { model: User, as: 'head', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      ],
    });
    if (!hospital) throw new NotFoundException('Hospital not found');

    const deptIds = (hospital.departments ?? []).map((d) => d.id);
    const departmentCount = deptIds.length;

    const staffCount = await this.staffModel.count({ where: { hospitalId: id } });

    let doctorCount = 0;
    let doctors: Doctor[] = [];
    if (deptIds.length > 0) {
      const docDepts = await this.doctorDepartmentModel.findAll({
        where: { departmentId: { [Op.in]: deptIds } },
        attributes: ['doctorId'],
      });
      const uniqueDoctorIds = [...new Set(docDepts.map((d) => d.doctorId))];
      doctorCount = uniqueDoctorIds.length;
      if (uniqueDoctorIds.length > 0) {
        doctors = await this.doctorModel.findAll({
          where: { id: { [Op.in]: uniqueDoctorIds } },
          include: [
            { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
            { model: DoctorDepartment, as: 'doctorDepartments', attributes: ['departmentId'], required: false },
          ],
        });
      }
    }

    let patientCount = 0;
    if (doctors.length > 0) {
      const doctorIds = doctors.map((d) => d.id);
      const appointments = await this.appointmentModel.findAll({
        where: { doctorId: { [Op.in]: doctorIds } },
        attributes: ['patientId'],
      });
      patientCount = new Set(appointments.map((a) => a.patientId)).size;
    }

    const plain = hospital.get({ plain: true }) as Record<string, unknown>;
    return {
      ...plain,
      stats: { departmentCount, doctorCount, staffCount, patientCount },
      doctors,
    };
  }

  async create(dto: CreateHospitalDto) {
    const { departmentNames, doctorIds, ...rest } = dto;
    const hospital = await this.hospitalModel.create(rest as Partial<Hospital>);

    if (departmentNames?.length) {
      await this.departmentModel.bulkCreate(
        departmentNames.map((name) => ({ name: name.trim(), hospitalId: hospital.id, isActive: true })),
      );
    }

    if (doctorIds?.length && hospital.id) {
      const depts = await this.departmentModel.findAll({ where: { hospitalId: hospital.id }, limit: 1 });
      const departmentId = depts[0]?.id;
      if (departmentId) {
        await this.doctorDepartmentModel.bulkCreate(
          doctorIds.map((doctorId) => ({ doctorId, departmentId })),
        );
      }
    }

    return hospital;
  }

  async update(id: number, dto: UpdateHospitalDto, performedByUserId?: number) {
    const hospital = await this.hospitalModel.findByPk(id);
    if (!hospital) throw new NotFoundException('Hospital not found');

    const { departmentNames, doctorIds, reason, ...rest } = dto;
    await hospital.update(rest as Partial<Hospital>);

    if (dto.isActive !== undefined && performedByUserId != null) {
      const action = dto.isActive ? 'activate' : 'deactivate';
      const reasonText = reason ?? '';
      await this.logsService.log(performedByUserId, action, 'hospital', id, JSON.stringify({ reason: reasonText }), undefined, reasonText);
    }

    if (departmentNames !== undefined) {
      await this.departmentModel.update({ isActive: false }, { where: { hospitalId: id } });
      if (departmentNames.length > 0) {
        const existing = await this.departmentModel.findAll({ where: { hospitalId: id } });
        const toCreate = departmentNames.filter((n) => !existing.some((e) => e.name === n.trim()));
        if (toCreate.length > 0) {
          await this.departmentModel.bulkCreate(
            toCreate.map((name) => ({ name: name.trim(), hospitalId: id, isActive: true })),
          );
        }
      }
      await this.departmentModel.update(
        { isActive: true },
        { where: { hospitalId: id, name: { [Op.in]: departmentNames.map((n) => n.trim()) } } },
      );
    }
    if (doctorIds !== undefined && hospital.id) {
      const depts = await this.departmentModel.findAll({ where: { hospitalId: id, isActive: true }, limit: 1 });
      const departmentId = depts[0]?.id;
      if (departmentId) {
        await this.doctorDepartmentModel.destroy({ where: { departmentId } });
        if (doctorIds.length > 0) {
          await this.doctorDepartmentModel.bulkCreate(
            doctorIds.map((doctorId: number) => ({ doctorId, departmentId })),
          );
        }
      }
    }
    return this.hospitalModel.findByPk(id, { include: [{ model: Department, required: false }] });
  }

  async remove(id: number, dto: DeactivateHospitalDto, performedByUserId: number) {
    const hospital = await this.hospitalModel.findByPk(id);
    if (!hospital) throw new NotFoundException('Hospital not found');
    await hospital.update({ isActive: false });

    await this.logsService.log(
      performedByUserId,
      'deactivate',
      'hospital',
      id,
      JSON.stringify({ reason: dto.reason }),
      undefined,
      dto.reason,
    );

    return { message: 'Hospital deactivated' };
  }
}
