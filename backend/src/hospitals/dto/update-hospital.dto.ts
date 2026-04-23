import { IsString, IsOptional, IsEmail, IsNumber, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { Transform, Expose } from 'class-transformer';

const emptyStringToUndefined = ({ value }: { value: unknown }) =>
  (value === '' || (typeof value === 'string' && value.trim() === '')) ? undefined : value;

export class UpdateHospitalDto {
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() name?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() address?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() phone?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsEmail() @IsOptional() email?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() description?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsDateString() @IsOptional() operatingDate?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() operatingHours?: string;
  @Expose()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsNumber() @IsOptional() headId?: number;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() recordsUrl?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() contractUrl?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() backgroundImageUrl?: string;
  @Expose() @Transform(emptyStringToUndefined)
  @IsString() @IsOptional() website?: string;
  @Expose()
  @Transform(({ value }) => (value === undefined || value === null ? undefined : Boolean(value)))
  @IsBoolean() @IsOptional() isActive?: boolean;
  @Expose() @IsString() @IsOptional() reason?: string;
  @Expose() @IsArray() @IsOptional() departmentNames?: string[];
  @Expose() @IsArray() @IsOptional() doctorIds?: number[];
}
