import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateNewsDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'SCHEDULED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

  /**
   * ISO datetime string (e.g. 2026-03-18T10:30)
   * Required when status = SCHEDULED
   */
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  /**
   * JSON stringified array of paragraphs from frontend editor.
   */
  @IsOptional()
  @IsString()
  content?: string;
}

