import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'SCHEDULED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

