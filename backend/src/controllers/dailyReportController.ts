import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import DailyReport from '../models/DailyReport';
import User from '../models/User';
import Notification from '../models/Notification';
import { getIO } from '../utils/socketService';

export const submitDailyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'student') {
      res.status(403).json({ message: 'Only students can submit daily reports' });
      return;
    }

    const student = await User.findById(req.user._id);
    const reportData = {
      ...req.body,
      studentId: req.user._id,
      studentName: student?.name || req.body.studentName || 'Student',
      status: 'submitted',
      submittedAt: new Date(),
    };

    const report = await DailyReport.create(reportData);

    // Notify supervisor if assigned
    if (student?.assignedSupervisorId) {
      const notification = await Notification.create({
        recipientId: student.assignedSupervisorId,
        message: `${student.name} submitted daily report for ${report.dayOfWeek} (${report.date}).`,
        type: 'report_submitted',
        link: '/student/progress',
      });

      try {
        getIO().to(student.assignedSupervisorId.toString()).emit('new_notification', notification);
      } catch (err) {
        console.error('Socket error:', err);
      }
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error while submitting daily report' });
  }
};

export const getDailyReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: Record<string, unknown> = {};

    if (req.user.role === 'student') {
      query = { studentId: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const assignedStudents = await User.find({ assignedSupervisorId: req.user._id }).select('_id');
      const studentIds = assignedStudents.map(s => s._id);
      query = { studentId: { $in: studentIds } };
    }

    const reports = await DailyReport.find(query).sort({ date: -1, createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching daily reports' });
  }
};

export const reviewDailyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only supervisors or admins can review daily reports' });
      return;
    }

    const { feedback, grade } = req.body;
    const status = grade !== undefined ? 'graded' : 'reviewed';

    const report = await DailyReport.findByIdAndUpdate(
      req.params.id,
      { feedback, grade, status },
      { new: true }
    );

    if (!report) {
      res.status(404).json({ message: 'Daily report not found' });
      return;
    }

    // Notify student
    await Notification.create({
      recipientId: report.studentId,
      message: `Your daily report for ${report.dayOfWeek} (${report.date}) was reviewed by your supervisor.`,
      type: 'report_reviewed',
      link: '/student/progress',
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error while reviewing daily report' });
  }
};
