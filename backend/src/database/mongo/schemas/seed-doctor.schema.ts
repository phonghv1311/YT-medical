import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'seed_doctors' })
export class SeedDoctor extends Document {
  @Prop({ required: true }) userId: string; // Mongo SeedUser _id or numeric ref
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ type: [String], default: [] }) specializations: string[];
  @Prop({ default: 0 }) yearsOfExperience: number;
  @Prop({ default: 0 }) averageRating: number;
  @Prop({ default: 0 }) totalReviews: number;
  @Prop({ type: String }) bio: string;
  @Prop({ type: Number }) consultationFee: number;
}

export const SeedDoctorSchema = SchemaFactory.createForClass(SeedDoctor);
SeedDoctorSchema.index({ userId: 1 });
SeedDoctorSchema.index({ specializations: 1 });
SeedDoctorSchema.index({ averageRating: -1 });
