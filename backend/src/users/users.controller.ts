import {
  Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service.js';
import { UsersAvatarService } from './users-avatar.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto.js';
import { DeactivateUserDto } from './dto/deactivate-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';
import { memoryStorage } from 'multer';

const avatarUpload = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: (e: Error | null, accept: boolean) => void) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error('Only image files are allowed'), false);
      return;
    }
    cb(null, true);
  },
};

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersAvatarService: UsersAvatarService,
  ) { }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser('id') userId: number) {
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser('id') userId: number, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Put('profile/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser('id') userId: number, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', avatarUpload))
  async uploadAvatar(
    @CurrentUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersAvatarService.uploadAvatar(userId, file);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findAll(
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll(page ? +page : 1, limit ? +limit : 20, {
      requesterRole,
      requesterId,
    });
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    if (requesterRole === 'admin') {
      await this.usersService.assertUserInHospitalScope(id, requesterId);
    }
    return this.usersService.getProfile(id);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    return this.usersService.createUser(dto, { requesterRole, requesterId });
  }

  @Put('users/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async deactivateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeactivateUserDto,
    @CurrentUser('id') performedByUserId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    if (requesterRole === 'admin') {
      await this.usersService.assertUserInHospitalScope(id, performedByUserId);
    }
    return this.usersService.deactivateUser(id, dto, performedByUserId);
  }

  @Put('users/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async adminResetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResetPasswordDto,
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    if (requesterRole === 'admin') {
      await this.usersService.assertUserInHospitalScope(id, requesterId);
    }
    return this.usersService.adminResetPassword(id, dto.newPassword);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') performedByUserId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    if (requesterRole === 'admin') {
      // Ensure target user is inside the same hospital before allowing mutations.
      await this.usersService.assertUserInHospitalScope(id, performedByUserId);
      return this.usersService.updateUser(id, dto, performedByUserId);
    }
    return this.usersService.updateUser(id, dto, performedByUserId);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
    @CurrentUser('id') performedByUserId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    if (requesterRole === 'admin') {
      await this.usersService.assertUserInHospitalScope(id, performedByUserId);
      return this.usersService.deleteUser(id, body?.reason, performedByUserId);
    }
    return this.usersService.deleteUser(id, body?.reason, performedByUserId);
  }
}
