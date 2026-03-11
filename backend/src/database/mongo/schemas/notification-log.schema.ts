import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'notification_logs' })
export class NotificationLog extends Document {
  @Prop({ required: true }) userId: number;
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) channel: string;
  @Prop() recipient: string;
  @Prop() subject: string;
  @Prop() body: string;
  @Prop({ default: 'pending' }) status: string;
  @Prop() error: string;
  @Prop({ type: Object }) metadata: Record<string, unknown>;
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);
