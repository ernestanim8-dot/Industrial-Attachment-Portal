import mongoose, { Document, Schema } from 'mongoose';

export interface ICheckIn extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  timestamp: Date;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  status: 'verified_on_site' | 'off_site';
  distanceFromAssignedKm?: number;
  notes?: string;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    date: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    status: {
      type: String,
      enum: ['verified_on_site', 'off_site'],
      default: 'verified_on_site',
    },
    distanceFromAssignedKm: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
