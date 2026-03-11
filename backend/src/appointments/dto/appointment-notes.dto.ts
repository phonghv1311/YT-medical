import { IsNotEmpty, IsString } from 'class-validator';

export class AppointmentNotesDto {
  @IsString() @IsNotEmpty() notes!: string;
}
