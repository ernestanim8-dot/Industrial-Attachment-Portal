import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'supervisor' | 'admin';
  department?: string;
  phone?: string;
  assignedSupervisorId?: mongoose.Types.ObjectId;
  otp?: string;
  otpExpiry?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'supervisor', 'admin'], default: 'student' },
  department: { 
    type: String, 
    enum: [
      'Bachelor of Technology in Graphic Design',
      'Bachelor of Technology in Ceramics',
      'Bachelor of Technology in Textiles',
      'Bachelor of Technology in Fashion Design',
      'Bachelor of Technology in Sculpture and Industrial Production',
      'Bachelor of Technology in Painting'
    ]
  },
  phone: { type: String },
  assignedSupervisorId: { type: Schema.Types.ObjectId, ref: 'User' },
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
