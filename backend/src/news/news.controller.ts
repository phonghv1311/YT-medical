import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';

import { CreateNewsDto } from './dto/create-news.dto.js';
import { UpdateNewsDto } from './dto/update-news.dto.js';
import { NewsService } from './news.service.js';

const coverUpload = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: (e: Error | null, accept: boolean) => void) => {
    const mime = file.mimetype?.toLowerCase() || '';
    if (!mime.startsWith('image/')) {
      cb(new BadRequestException('Only image files are allowed'), false);
      return;
    }
    cb(null, true);
  },
};

@Controller('news')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @HttpCode(200)
  async findAll(
    @Query() _query: Record<string, string>,
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    return { data: await this.newsService.listScoped({ requesterRole, requesterId }) };
  }

  @Get(':id')
  @HttpCode(200)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    const article = await this.newsService.getById(id, { requesterRole, requesterId });
    return { data: article };
  }

  @Post()
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('coverImage', coverUpload))
  async create(
    @Body() dto: CreateNewsDto,
    @CurrentUser('id') performedByUserId: number,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    const created = await this.newsService.create(
      {
        title: dto.title,
        category: dto.category,
        status: dto.status,
        scheduledAt: dto.scheduledAt,
        content: dto.content,
      },
      coverFile,
      performedByUserId,
    );
    return { data: created };
  }

  @Put(':id')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('coverImage', coverUpload))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNewsDto,
    @CurrentUser('id') performedByUserId: number,
    @CurrentUser('role') requesterRole: string,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    if (!dto.title) throw new BadRequestException('title is required');

    const updated = await this.newsService.update(
      id,
      {
        title: dto.title,
        category: dto.category,
        status: dto.status,
        scheduledAt: dto.scheduledAt,
        content: dto.content,
      },
      coverFile,
      performedByUserId,
      { requesterRole, requesterId: performedByUserId },
    );
    return { data: updated };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') requesterId: number,
    @CurrentUser('role') requesterRole: string,
  ) {
    return this.newsService.delete(id, { requesterRole, requesterId });
  }

  @Post('scan-scheduled')
  @HttpCode(200)
  async scanScheduled() {
    await this.newsService.scanAndPublishDue();
    return { message: 'Scan finished' };
  }
}
