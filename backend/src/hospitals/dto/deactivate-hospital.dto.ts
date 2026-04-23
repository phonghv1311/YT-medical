import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class DeactivateHospitalDto {
  @IsString()
  @IsNotEmpty({ message: 'Reason is required when deactivating or deleting' })
  @MaxLength(1000)
  reason!: string;
}
