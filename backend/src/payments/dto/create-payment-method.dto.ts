import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { PaymentMethodType } from '../../database/models/payment-method.model.js';

export class CreatePaymentMethodDto {
  @IsEnum(PaymentMethodType) type!: PaymentMethodType;
  @IsString() provider!: string;
  @IsString() @IsOptional() providerCustomerId?: string;
  @IsString() @IsOptional() last4?: string;
  @IsBoolean() @IsOptional() isDefault?: boolean;
}
