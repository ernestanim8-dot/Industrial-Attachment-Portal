import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  fileUrl: string;
  type: 'weekly' | 'monthly' | 'final';
  status: 'pending' | 'reviewed' | 'graded';
  weekNumber?: number;
  fileName?: string;
  fileSize?: string;
}

const ReportSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String },
  fileSize: { type: String },
  type: { type: String, enum: ['weekly', 'monthly', 'final'], default: 'weekly' },
  status: { type: String, enum: ['pending', 'reviewed', 'graded'], default: 'pending' },
  weekNumber: { type: Number },
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema);
