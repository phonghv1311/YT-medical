import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsString() @IsOptional() phone?: string;
  @IsNumber() roleId!: number;
  @IsNumber() @IsOptional() hospitalId?: number;
  @IsNumber() @IsOptional() departmentId?: number;
}
