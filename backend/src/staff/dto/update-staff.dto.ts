import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdateStaffDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsString() @IsOptional() phone?: string;
  @IsNumber() @IsOptional() hospitalId?: number;
  @IsNumber() @IsOptional() departmentId?: number;
  @IsString() @IsOptional() jobTitle?: string;
  @IsString() @IsOptional() position?: string;
  @IsDateString() @IsOptional() startDate?: string;
  @IsNumber() @IsOptional() weeklyHours?: number;
  @IsString() @IsOptional() contractUrl?: string;
  @IsString() @IsOptional() profilePhotoUrl?: string;
  @IsString() @IsOptional() resumeUrl?: string;
}
