import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRecordDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsNotEmpty() recordDate!: string;
}
