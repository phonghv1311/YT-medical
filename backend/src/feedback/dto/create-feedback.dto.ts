import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString() @IsNotEmpty() @MaxLength(200) subject!: string;
  @IsString() @IsNotEmpty() body!: string;
}
