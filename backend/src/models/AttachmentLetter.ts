import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachmentLetter extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  department?: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  companyName: string;
  companyTown: string;
  letterAddressedTo: string;
  studentSignature?: string;
}

const AttachmentLetterSchema = new Schema<IAttachmentLetter>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    department: { type: String },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    companyName: { type: String, required: true },
    companyTown: { type: String, required: true },
    letterAddressedTo: { type: String, required: true },
    studentSignature: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAttachmentLetter>('AttachmentLetter', AttachmentLetterSchema);
