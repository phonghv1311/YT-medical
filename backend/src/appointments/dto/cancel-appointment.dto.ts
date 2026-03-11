import { IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @IsString() @IsOptional() cancelReason?: string;
}
