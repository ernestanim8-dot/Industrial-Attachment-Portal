import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import AttachmentLetter from '../models/AttachmentLetter';
import Notification from '../models/Notification';
import User from '../models/User';
import { getIO } from '../utils/socketService';

export const submitAttachmentLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findById(req.user._id);
    const letterData = {
      ...req.body,
      studentId: req.user._id,
      studentName: student?.name || req.body.studentName || 'Student',
      department: student?.department || req.body.department,
    };

    const letter = await AttachmentLetter.create(letterData);

    const notification = await Notification.create({
      recipientId: student?.assignedSupervisorId || req.user._id,
      message: `${letter.studentName} requested an Attachment Letter addressed to ${letter.companyName}.`,
      type: 'info',
      link: '/student/services/introductory-letter',
    });

    try {
      getIO().emit('new_notification', notification);
    } catch (err) {
      console.error('Socket error:', err);
    }

    res.status(201).json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Server error while requesting Attachment Letter' });
  }
};

export const getAttachmentLetters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: Record<string, unknown> = {};
    if (req.user.role === 'student') {
      query = { studentId: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const assignedStudents = await User.find({ assignedSupervisorId: req.user._id }).select('_id');
      const studentIds = assignedStudents.map(s => s._id);
      query = { studentId: { $in: studentIds } };
    }

    const letters = await AttachmentLetter.find(query).sort({ createdAt: -1 });
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching Attachment Letters' });
  }
};

export const updateAttachmentLetterStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Not authorized to update status' });
      return;
    }

    const { status } = req.body;
    const letter = await AttachmentLetter.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!letter) {
      res.status(404).json({ message: 'Attachment letter record not found' });
      return;
    }

    await Notification.create({
      recipientId: letter.studentId,
      message: `Your Attachment Letter request for ${letter.companyName} has been ${status}.`,
      type: 'info',
      link: '/student/services/introductory-letter',
    });

    res.json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating Attachment Letter status' });
  }
};
