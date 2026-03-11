import { IsNumber, Min } from 'class-validator';

export class CreateTipDto {
  @IsNumber() @Min(0) amount!: number;
}
