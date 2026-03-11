import { IsInt, IsOptional } from 'class-validator';

export class BuyPackageDto {
  @IsInt() packageId!: number;
  @IsInt() @IsOptional() paymentMethodId?: number;
}
