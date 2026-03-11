import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../database/models/user.model.js';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'avatars');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Injectable()
export class UsersAvatarService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }

  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ avatar: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, GIF, WebP.');
    }

    const ext = file.originalname?.match(/\.(jpe?g|png|gif|webp)$/i)?.[1] ?? 'jpg';
    const filename = `${userId}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, file.buffer);

    const relativeUrl = `/uploads/avatars/${filename}`;
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new BadRequestException('User not found');

    const oldAvatar = user.avatar;
    await user.update({ avatar: relativeUrl });

    if (oldAvatar?.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(process.cwd(), oldAvatar);
      try {
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {
        // ignore
      }
    }

    return { avatar: relativeUrl };
  }
}
