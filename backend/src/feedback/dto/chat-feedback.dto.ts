import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsString() role!: 'user' | 'assistant' | 'system';
  @IsString() @IsNotEmpty() content!: string;
}

export class ChatFeedbackDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}
