import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachmentLetter extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentRegNo?: string;
  studentPhone?: string;
  department?: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'verified' | 'submitted' | 'pdf_generated';
  companyName: string;
  companyTown: string;
  companyAddress?: string;
  letterAddressedTo: string;
  studentSignature?: string;
  startDate?: string;
  endDate?: string;
  refNumber?: string;
}

const AttachmentLetterSchema = new Schema<IAttachmentLetter>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentRegNo: { type: String },
    studentPhone: { type: String },
    department: { type: String },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'verified', 'submitted', 'pdf_generated'],
      default: 'pending',
    },
    companyName: { type: String, required: true },
    companyTown: { type: String, required: true },
    companyAddress: { type: String },
    letterAddressedTo: { type: String, required: true },
    studentSignature: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    refNumber: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAttachmentLetter>('AttachmentLetter', AttachmentLetterSchema);
