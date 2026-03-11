import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, MinLength, IsDateString } from 'class-validator';

export class CreateStaffDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
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
