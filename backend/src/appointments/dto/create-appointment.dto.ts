import { IsNotEmpty, IsNumber, IsOptional, IsString, IsIn, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber() @IsNotEmpty() doctorId!: number;
  @IsString() @IsNotEmpty() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'scheduledAt must be YYYY-MM-DD' }) scheduledAt!: string;
  @IsString() @IsNotEmpty() @Matches(/^\d{1,2}:\d{2}(:\d{2})?$/, { message: 'startTime must be HH:mm or HH:mm:ss' }) startTime!: string;
  @IsString() @IsNotEmpty() @Matches(/^\d{1,2}:\d{2}(:\d{2})?$/, { message: 'endTime must be HH:mm or HH:mm:ss' }) endTime!: string;
  @IsString() @IsOptional() @IsIn(['video', 'in_person']) type?: string;
  @IsNumber() @IsOptional() slotId?: number;
}
