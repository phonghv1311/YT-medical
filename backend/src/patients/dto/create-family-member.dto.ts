import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsString() @IsNotEmpty() relationship!: string;
  @IsString() @IsOptional() dateOfBirth?: string;
  @IsString() @IsOptional() @IsIn(['male', 'female', 'other']) gender?: string;
  @IsString() @IsOptional() bloodType?: string;
  @IsString() @IsOptional() statusNotes?: string;
}
