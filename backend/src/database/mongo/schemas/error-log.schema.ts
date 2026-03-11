import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'error_logs' })
export class ErrorLog extends Document {
  @Prop() userId: number | null;
  @Prop({ required: true }) method: string;
  @Prop({ required: true }) url: string;
  @Prop({ required: true }) statusCode: number;
  @Prop({ required: true }) message: string;
  @Prop() stack: string | null;
  @Prop({ type: Object }) metadata: Record<string, unknown>;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
