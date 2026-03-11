import { IsString, IsOptional, IsEmail, IsNumber, IsArray, IsDateString } from 'class-validator';

export class UpdateHospitalDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() description?: string;
  @IsDateString() @IsOptional() operatingDate?: string;
  @IsString() @IsOptional() operatingHours?: string;
  @IsNumber() @IsOptional() headId?: number;
  @IsString() @IsOptional() recordsUrl?: string;
  @IsString() @IsOptional() contractUrl?: string;
  @IsString() @IsOptional() backgroundImageUrl?: string;
  @IsString() @IsOptional() website?: string;
  @IsArray() @IsOptional() departmentNames?: string[];
  @IsArray() @IsOptional() doctorIds?: number[];
}
