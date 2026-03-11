import { IsIn, IsString, IsNotEmpty, MaxLength } from 'class-validator';

const ALLOWED_TYPES = ['appointment', 'payment', 'system', 'chat'] as const;

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_TYPES)
  type!: typeof ALLOWED_TYPES[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}
