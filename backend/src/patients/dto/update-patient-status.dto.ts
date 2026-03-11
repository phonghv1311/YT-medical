import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePatientStatusDto {
  @IsString() @IsNotEmpty() status!: string;
  @IsString() @IsOptional() notes?: string;
}
