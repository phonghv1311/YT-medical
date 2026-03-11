import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'seed_appointments' })
export class SeedAppointment extends Document {
  @Prop({ required: true }) patientId: string;
  @Prop({ required: true }) doctorId: string;
  @Prop({ required: true }) status: string;
  @Prop({ required: true }) scheduledAt: Date;
  @Prop() startTime: string;
  @Prop() endTime: string;
  @Prop({ default: 'video' }) type: string;
  @Prop({ type: String }) notes: string;
}

export const SeedAppointmentSchema = SchemaFactory.createForClass(SeedAppointment);
SeedAppointmentSchema.index({ patientId: 1 });
SeedAppointmentSchema.index({ doctorId: 1 });
SeedAppointmentSchema.index({ scheduledAt: 1 });
SeedAppointmentSchema.index({ status: 1 });
