import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() licenseNumber?: string;
  @IsNumber() @IsOptional() yearsOfExperience?: number;
  @IsNumber() @IsOptional() consultationFee?: number;
}
