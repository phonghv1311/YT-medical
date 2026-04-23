import { IsEmail, IsString, MinLength, IsOptional, IsNumber, IsArray, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsString() @IsOptional() phone?: string;
  @IsNumber() roleId!: number;
  @IsNumber() @IsOptional() hospitalId?: number;
  @IsNumber() @IsOptional() departmentId?: number;

  /**
   * Doctor specialization IDs ("khoa").
   * Used when creating a user with role doctor.
   */
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  specializationIds?: number[];
}
