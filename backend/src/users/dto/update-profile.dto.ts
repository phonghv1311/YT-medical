import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class UpdateProfileDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() avatar?: string;
  @IsDateString() @IsOptional() dateOfBirth?: string;
  @IsString() @IsOptional() gender?: string;
  @IsNumber() @IsOptional() height?: number;
  @IsNumber() @IsOptional() weight?: number;
}
