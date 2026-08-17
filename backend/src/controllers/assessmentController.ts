import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { AuthRequest } from '../middleware/authMiddleware';
import Assessment from '../models/Assessment';
import Report from '../models/Report';
import Notification from '../models/Notification';

interface CreateAssessmentBody {
  reportId: string;
  feedback: string;
  grade: number;
  criteria: {
    content: number;
    presentation: number;
    understanding: number;
  };
}

interface ParamsWithReportId extends ParamsDictionary {
  reportId: string;
}

export const createAssessment = async (
  req: Request<ParamsDictionary, object, CreateAssessmentBody>,
  res: Response<object>,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (authReq.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Only supervisors can create assessments' });
      return;
    }

    const { reportId, feedback, grade, criteria } = req.body;

    const assessment = await Assessment.create({
      reportId,
      supervisorId: authReq.user._id,
      feedback,
      grade,
      criteria
    });

    // Update the associated report status to graded
    const report = await Report.findByIdAndUpdate(reportId, { status: 'graded' });

    // Notify student
    if (report) {
      await Notification.create({
        recipientId: report.studentId,
        message: `Your report "${report.title}" has been graded with ${grade}%.`,
        type: 'report_graded',
        link: `/reports/${report._id}`
      });
    }

    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating assessment' });
  }
};

export const getAssessmentsByReport = async (
  req: Request<ParamsWithReportId, object, object>,
  res: Response<object>,
  next: NextFunction
): Promise<void> => {
  try {
    const assessments = await Assessment.find({ reportId: req.params.reportId })
      .populate('supervisorId', 'name email');
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching assessments' });
  }
};

export const getAllAssessments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (authReq.user.role !== 'admin' && authReq.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    const assessments = await Assessment.find().populate('supervisorId', 'name email');
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching all assessments' });
  }
};
