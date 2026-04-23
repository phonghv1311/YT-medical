import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import express from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Disable ETag so GET endpoints do not return 304 "Not Modified" for cached requests.
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance() as { set?: (key: string, val: unknown) => void };
  instance.set?.('etag', false);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = app.get(ConfigService);
  app.enableCors({ origin: config.get<string>('FRONTEND_URL', 'http://localhost:5173'), credentials: true });
  app.setGlobalPrefix('api');

  // Serve uploaded avatars at /uploads/avatars (no /api prefix)
  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
