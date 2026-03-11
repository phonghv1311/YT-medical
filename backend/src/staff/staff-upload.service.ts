import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'staff');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'text/csv': 'csv',
  'application/csv': 'csv',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

@Injectable()
export class StaffUploadService {
  constructor() {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File too large. Maximum size is 10MB.');
    }
    const mime = file.mimetype?.toLowerCase();
    if (!mime || !ALLOWED_MIMES.includes(mime)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: image (JPEG, PNG, GIF, WebP), PDF, CSV, Excel (.xls, .xlsx).',
      );
    }

    const ext = (EXT_BY_MIME[mime] ?? path.extname(file.originalname || '')?.slice(1)) || 'bin';
    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, file.buffer);

    const relativeUrl = `/uploads/staff/${filename}`;
    return { url: relativeUrl };
  }
}
