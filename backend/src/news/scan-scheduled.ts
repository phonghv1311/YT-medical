import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { NewsService } from './news.service.js';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const newsService = app.get(NewsService);
    await newsService.scanAndPublishDue();
    // eslint-disable-next-line no-console
    console.log('News scheduled scan completed');
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

