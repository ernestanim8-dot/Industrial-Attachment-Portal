import mongoose, { Document, Schema } from 'mongoose';

export interface IAssumption extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  companyZone?: string;
  companyLocation?: string;
  companyAddress?: string;
  companySupervisor?: string;
  letterAddressedTo?: string;
  companyTown?: string;
  dateOfCommencement?: string;
  supervisorPhone?: string;
  studentSignature?: string;
}

const AssumptionSchema = new Schema<IAssumption>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    companyName: { type: String, required: true },
    companyPhone: { type: String },
    companyEmail: { type: String },
    companyZone: { type: String },
    companyLocation: { type: String },
    companyAddress: { type: String },
    companySupervisor: { type: String },
    letterAddressedTo: { type: String },
    companyTown: { type: String },
    dateOfCommencement: { type: String },
    supervisorPhone: { type: String },
    studentSignature: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAssumption>('Assumption', AssumptionSchema);
