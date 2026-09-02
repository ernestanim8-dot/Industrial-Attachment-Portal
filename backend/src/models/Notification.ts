import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  message: string;
  type: 'report_submitted' | 'report_graded' | 'report_reviewed' | 'supervisor_assigned' | 'system' | 'info';
  read: boolean;
  link?: string;
}

const NotificationSchema: Schema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['report_submitted', 'report_graded', 'report_reviewed', 'supervisor_assigned', 'system', 'info'],
    default: 'system'
  },
  read: { type: Boolean, default: false },
  link: { type: String },
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
