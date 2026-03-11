import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('doctorsLimit') doctorsLimit?: string,
    @Query('hospitalsLimit') hospitalsLimit?: string,
  ) {
    return this.searchService.search(q ?? '', {
      doctorsLimit: doctorsLimit ? parseInt(doctorsLimit, 10) : undefined,
      hospitalsLimit: hospitalsLimit ? parseInt(hospitalsLimit, 10) : undefined,
    });
  }
}
