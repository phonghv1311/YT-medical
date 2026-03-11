import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsArray, IsDateString } from 'class-validator';

export class CreateHospitalDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() address!: string;
  @IsString() @IsNotEmpty() phone!: string;
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
