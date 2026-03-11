import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QualificationItemDto {
  @IsString()
  qualification: string;

  @IsString()
  @IsOptional()
  institution?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  year?: number;
}

export class DoctorOnboardingDto {
  /** Step 1: Professional info / affiliation */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  licenseNumber?: string;

  /** Primary affiliation: department (implies hospital) */
  @IsNumber()
  @IsOptional()
  primaryDepartmentId?: number;

  /** Step 1 & 2: specialty/specializations (dropdown + areas of expertise) */
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  specializationIds?: number[];

  /** Step 2: Professional details */
  @IsNumber()
  @IsOptional()
  @Min(0)
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QualificationItemDto)
  qualifications?: QualificationItemDto[];
}
