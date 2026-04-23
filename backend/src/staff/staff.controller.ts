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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StaffService } from './staff.service.js';
import { StaffUploadService } from './staff-upload.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { Roles, CurrentUser } from '../common/decorators/index.js';

const STAFF_FILE_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/csv', 'application/csv',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const staffFileUpload = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: (e: Error | null, accept: boolean) => void) => {
    const mime = file.mimetype?.toLowerCase();
    if (!mime || !STAFF_FILE_MIMES.includes(mime)) {
      cb(new Error('Allowed: image, PDF, CSV, Excel'), false);
      return;
    }
    cb(null, true);
  },
};

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly staffUploadService: StaffUploadService,
  ) { }

  /** Current user's staff profile (staff role; admin/superadmin get 404 if no staff record). */
  @Get('me')
  @Roles('admin', 'superadmin', 'staff')
  getMe(@CurrentUser('id') userId: number) {
    return this.staffService.findByUserId(userId);
  }

  /** Upload file for staff (profile photo, contract, resume). Returns { url }. */
  @Post('upload')
  @Roles('admin', 'superadmin')
  @UseInterceptors(FileInterceptor('file', staffFileUpload))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.staffUploadService.uploadFile(file);
  }

  /** List staff. Admin/superadmin: all or filter by hospitalId. Staff: only same hospital. */
  @Get()
  @Roles('admin', 'superadmin', 'staff')
  async findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const params = {
      hospitalId: hospitalId ? +hospitalId : undefined,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    };
    if (role === 'staff' || role === 'admin') {
      const myStaff = await this.staffService.findByUserId(userId);
      const myHospitalId = myStaff?.hospitalId ?? undefined;
      if (!myHospitalId) throw new ForbiddenException('Access denied');
      return this.staffService.findAll({ ...params, hospitalId: myHospitalId });
    }
    return this.staffService.findAll(params);
  }

  /** Get one staff. Admin/superadmin: any. Staff: self or same hospital only. */
  @Get(':id')
  @Roles('admin', 'superadmin', 'staff')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    if (role === 'staff' || role === 'admin') {
      const myStaff = await this.staffService.findByUserId(userId);
      if (!myStaff) throw new ForbiddenException('Staff profile required');
      if (myStaff.id !== id) {
        const target = await this.staffService.findOne(id);
        if (target.hospitalId == null || target.hospitalId !== myStaff.hospitalId) throw new ForbiddenException('Access denied');
      }
    }
    return this.staffService.findOne(id);
  }

  /** Create staff. Admin/superadmin only. */
  @Post()
  @Roles('admin', 'superadmin')
  async create(
    @Body() dto: CreateStaffDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    if (role === 'admin') {
      const myStaff = await this.staffService.findByUserId(userId);
      if (!myStaff?.hospitalId) throw new ForbiddenException('Access denied');
      dto.hospitalId = myStaff.hospitalId;
    }
    return this.staffService.create(dto);
  }

  /** Update staff. Admin/superadmin: any. Staff: own profile only. */
  @Put(':id')
  @Roles('admin', 'superadmin', 'staff')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateStaffDto,
  ) {
    if (role === 'staff') {
      const myStaff = await this.staffService.findByUserId(userId);
      if (!myStaff || myStaff.id !== id) throw new ForbiddenException('Can only update own profile');
    }
    if (role === 'admin') {
      const myStaff = await this.staffService.findByUserId(userId);
      if (!myStaff?.hospitalId) throw new ForbiddenException('Access denied');
      const target = await this.staffService.findOne(id);
      if (!target?.hospitalId || target.hospitalId !== myStaff.hospitalId) throw new ForbiddenException('Access denied');
    }
    return this.staffService.update(id, dto);
  }

  /** Deactivate staff. Admin/superadmin only. */
  @Delete(':id')
  @Roles('admin', 'superadmin')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    if (role === 'admin') {
      const myStaff = await this.staffService.findByUserId(userId);
      if (!myStaff?.hospitalId) throw new ForbiddenException('Access denied');
      const target = await this.staffService.findOne(id);
      if (!target?.hospitalId || target.hospitalId !== myStaff.hospitalId) throw new ForbiddenException('Access denied');
    }
    return this.staffService.remove(id);
  }
}
