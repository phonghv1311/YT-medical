import { IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateScheduleDto {
  @IsNumber() @Min(0) @Max(6) dayOfWeek!: number;
  @IsString() @IsNotEmpty() startTime!: string;
  @IsString() @IsNotEmpty() endTime!: string;
}
