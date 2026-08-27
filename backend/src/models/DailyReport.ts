import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyReport extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  date: string;
  dayOfWeek: string;
  weekNumber: number;
  monthNumber: number;
  monthName: string;
  title: string;
  tasksCompleted: string;
  skillsAcquired?: string;
  challengesFaced?: string;
  hoursWorked: number;
  equipmentOrTools?: string;
  submittedAt: Date;
  status: 'submitted' | 'reviewed' | 'graded';
  grade?: number;
  feedback?: string;
  locationVerified?: boolean;
}

const DailyReportSchema = new Schema<IDailyReport>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    date: { type: String, required: true },
    dayOfWeek: { type: String, required: true },
    weekNumber: { type: Number, required: true },
    monthNumber: { type: Number, required: true },
    monthName: { type: String, required: true },
    title: { type: String, required: true },
    tasksCompleted: { type: String, required: true },
    skillsAcquired: { type: String },
    challengesFaced: { type: String },
    hoursWorked: { type: Number, default: 8 },
    equipmentOrTools: { type: String },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'graded'],
      default: 'submitted',
    },
    grade: { type: Number },
    feedback: { type: String },
    locationVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDailyReport>('DailyReport', DailyReportSchema);
