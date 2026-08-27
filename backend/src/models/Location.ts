import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  zone: string;
  city: string;
  address: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true },
    zone: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    contactPerson: { type: String },
    contactPhone: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILocation>('Location', LocationSchema);
