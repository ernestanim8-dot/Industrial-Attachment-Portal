import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Report from '../models/Report';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendEmail } from '../utils/emailService';
import { getIO } from '../utils/socketService';

export const submitReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, fileUrl, type, weekNumber, fileName, fileSize } = req.body;
    
    // Only students can submit reports
    if (req.user.role !== 'student') {
      res.status(403).json({ message: 'Only students can submit reports' });
      return;
    }

    const report = await Report.create({
      studentId: req.user._id,
      title,
      description,
      fileUrl,
      fileName,
      fileSize,
      type,
      weekNumber,
      status: 'pending'
    });

    // Notify supervisor if assigned
    const student = await User.findById(req.user._id);
    if (student?.assignedSupervisorId) {
      const notification = await Notification.create({
        recipientId: student.assignedSupervisorId,
        message: `New report submitted by ${student.name}: ${title}`,
        type: 'report_submitted',
        link: `/reports/${report._id}`
      });

      // Real-time update
      try {
        getIO().to(student.assignedSupervisorId.toString()).emit('new_notification', notification);
      } catch (err) {
        console.error('Socket error:', err);
      }

      const supervisor = await User.findById(student.assignedSupervisorId);
      if (supervisor) {
        await sendEmail(
          supervisor.email,
          'New Report Submission',
          `${student.name} has submitted a new report: ${title}. Please log in to review it.`,
          `<p><strong>${student.name}</strong> has submitted a new report: <em>${title}</em>.</p><p>Please log in to the portal to review it.</p>`
        );
      }
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error while submitting report' });
  }
};

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: Record<string, unknown> = {};
    
    // If student, only see their own reports
    if (req.user.role === 'student') {
      query = { studentId: req.user._id };
    } 
    // If supervisor, only see reports of assigned students
    else if (req.user.role === 'supervisor') {
      const assignedStudents = await User.find({ assignedSupervisorId: req.user._id }).select('_id');
      const studentIds = assignedStudents.map(s => s._id);
      query = { studentId: { $in: studentIds } };
    }
    // Admin sees all reports (no query filter needed)

    const reports = await Report.find(query)
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching reports' });
  }
};

export const getReportById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('studentId', 'name email');
      
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching report' });
  }
};

export const updateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to update reports' });
      return;
    }
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('studentId', 'name email');
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    // Send email to student if status changed to reviewed or graded
    if (req.body.status && (req.body.status === 'reviewed' || req.body.status === 'graded')) {
      const student = report.studentId as any; // populated
      if (student && student.email) {
        const action = req.body.status === 'graded' ? 'graded' : 'reviewed';
        
        const notification = await Notification.create({
          recipientId: student._id,
          message: `Your report "${report.title}" has been ${action}.`,
          type: req.body.status === 'graded' ? 'report_graded' : 'report_reviewed',
          link: `/reports/${report._id}`
        });

        // Real-time update
        try {
          getIO().to(student._id.toString()).emit('new_notification', notification);
        } catch (err) {
          console.error('Socket error:', err);
        }

        await sendEmail(
          student.email,
          `Report ${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)}: ${report.title}`,
          `Your report "${report.title}" has been ${action}. Log in to view your feedback.`,
          `<p>Your report <strong>"${report.title}"</strong> has been ${action}.</p><p>Log in to the portal to view your feedback.</p>`
        );
      }
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating report' });
  }
};

export const exportReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to export reports' });
      return;
    }

    const reports = await Report.find({})
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    let csv = 'Report Title,Student Name,Student Email,Week Number,Status,Grade,Submission Date\n';
    
    reports.forEach((report: any) => {
      const title = `"${(report.title || '').replace(/"/g, '""')}"`;
      const studentName = report.studentId ? `"${report.studentId.name}"` : '"Unknown"';
      const studentEmail = report.studentId ? `"${report.studentId.email}"` : '"Unknown"';
      const week = report.weekNumber || '';
      const status = report.status || '';
      const grade = report.grade || '';
      const date = report.createdAt ? new Date(report.createdAt).toISOString().split('T')[0] : '';
      
      csv += `${title},${studentName},${studentEmail},${week},${status},${grade},${date}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('reports_export.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error while exporting reports' });
  }
};
