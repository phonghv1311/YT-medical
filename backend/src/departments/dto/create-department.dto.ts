import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateDepartmentDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsNumber() hospitalId!: number;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() headId?: number;
}
