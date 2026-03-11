import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePrescriptionDto {
  @IsNumber() @IsOptional() appointmentId?: number;
  @IsNumber() @IsNotEmpty() patientId!: number;
  @IsString() @IsNotEmpty() medications!: string;
  @IsString() @IsOptional() notes?: string;
}
