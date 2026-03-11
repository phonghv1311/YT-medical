import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'call_logs' })
export class CallLog extends Document {
  @Prop({ required: true }) appointmentId: number;
  @Prop({ required: true }) doctorId: number;
  @Prop({ required: true }) patientId: number;
  @Prop({ required: true }) provider: string;
  @Prop({ required: true }) roomName: string;
  @Prop({ required: true }) startedAt: Date;
  @Prop() endedAt: Date | null;
  @Prop() durationSeconds: number | null;
  @Prop({ required: true, default: 'initiated' }) status: string;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);
