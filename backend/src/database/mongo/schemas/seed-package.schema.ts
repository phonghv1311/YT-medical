import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'seed_packages' })
export class SeedPackage extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ type: String, default: '' }) description: string;
  @Prop({ required: true, default: 0 }) price: number;
  @Prop({ required: true }) durationDays: number;
  @Prop({ default: true }) isActive: boolean;
}

export const SeedPackageSchema = SchemaFactory.createForClass(SeedPackage);
SeedPackageSchema.index({ isActive: 1 });
SeedPackageSchema.index({ price: 1 });
