import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'seed_users' })
export class SeedUser extends Document {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ type: String }) phone: string;
  @Prop({ required: true }) role: string;
  @Prop({ default: true }) isActive: boolean;
}

export const SeedUserSchema = SchemaFactory.createForClass(SeedUser);
SeedUserSchema.index({ role: 1 });
