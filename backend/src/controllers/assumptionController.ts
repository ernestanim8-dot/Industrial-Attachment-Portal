import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Assumption from '../models/Assumption';
import Notification from '../models/Notification';
import User from '../models/User';
import { getIO } from '../utils/socketService';

export const submitAssumption = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findById(req.user._id);
    const assumptionData = {
      ...req.body,
      studentId: req.user._id,
      studentName: student?.name || req.body.studentName || 'Student',
    };

    const assumption = await Assumption.create(assumptionData);

    // Notify admins / supervisors
    const notification = await Notification.create({
      recipientId: student?.assignedSupervisorId || req.user._id,
      message: `${assumption.studentName} has submitted an Assumption of Duty form for ${assumption.companyName}.`,
      type: 'info',
      link: '/student/services/assumption-form',
    });

    try {
      getIO().emit('new_notification', notification);
    } catch (err) {
      console.error('Socket error:', err);
    }

    res.status(201).json(assumption);
  } catch (error) {
    res.status(500).json({ message: 'Server error while submitting Assumption form' });
  }
};

export const getAssumptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: Record<string, unknown> = {};
    if (req.user.role === 'student') {
      query = { studentId: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const assignedStudents = await User.find({ assignedSupervisorId: req.user._id }).select('_id');
      const studentIds = assignedStudents.map(s => s._id);
      query = { studentId: { $in: studentIds } };
    }

    const assumptions = await Assumption.find(query).sort({ createdAt: -1 });
    res.json(assumptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching Assumption forms' });
  }
};

export const updateAssumptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Not authorized to update status' });
      return;
    }

    const { status } = req.body;
    const assumption = await Assumption.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!assumption) {
      res.status(404).json({ message: 'Assumption record not found' });
      return;
    }

    // Notify student of status update
    await Notification.create({
      recipientId: assumption.studentId,
      message: `Your Assumption of Duty form has been marked as ${status}.`,
      type: 'info',
      link: '/student/services/assumption-form',
    });

    res.json(assumption);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating Assumption status' });
  }
};
