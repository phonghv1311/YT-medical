import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class DeactivateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Reason is required when deactivating a user' })
  @MaxLength(1000)
  reason!: string;
}
