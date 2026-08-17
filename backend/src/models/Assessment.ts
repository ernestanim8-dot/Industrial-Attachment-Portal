import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessment extends Document {
  reportId: mongoose.Types.ObjectId;
  supervisorId: mongoose.Types.ObjectId;
  feedback: string;
  grade: number;
  criteria: {
    content: number;
    presentation: number;
    understanding: number;
  };
}

const AssessmentSchema: Schema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  supervisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  feedback: { type: String, required: true },
  grade: { type: Number, required: true, min: 0, max: 100 },
  criteria: {
    content: { type: Number, min: 0, max: 100 },
    presentation: { type: Number, min: 0, max: 100 },
    understanding: { type: Number, min: 0, max: 100 }
  }
}, { timestamps: true });

export default mongoose.model<IAssessment>('Assessment', AssessmentSchema);
