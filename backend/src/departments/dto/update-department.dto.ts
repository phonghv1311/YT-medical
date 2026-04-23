import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateDepartmentDto {
  @IsString() @IsOptional() name?: string;
  @IsNumber() @IsOptional() hospitalId?: number;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() headId?: number;
}
