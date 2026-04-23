import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/index.js';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Get()
  findAll() {
    return [];
  }
}
