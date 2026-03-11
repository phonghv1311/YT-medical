import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'seed_notifications' })
export class SeedNotification extends Document {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) title: string;
  @Prop({ default: '' }) body: string;
  @Prop({ type: Date, default: null }) readAt: Date | null;
}

export const SeedNotificationSchema = SchemaFactory.createForClass(SeedNotification);
SeedNotificationSchema.index({ userId: 1 });
SeedNotificationSchema.index({ readAt: 1 });
