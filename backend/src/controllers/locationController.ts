import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Location from '../models/Location';
import CheckIn from '../models/CheckIn';
import User from '../models/User';
import Notification from '../models/Notification';

export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching locations' });
  }
};

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Only staff can create locations' });
      return;
    }
    const location = await Location.create(req.body);
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating location' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Only staff can update locations' });
      return;
    }
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating location' });
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Only staff can delete locations' });
      return;
    }
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting location' });
  }
};

export const assignStudentLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Only staff can allocate student locations' });
      return;
    }

    const { studentId, locationId } = req.body;
    const location = await Location.findById(locationId);
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    const student = await User.findById(studentId);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    await Notification.create({
      recipientId: student._id,
      message: `You have been allocated to "${location.name}" (${location.city}, ${location.zone}).`,
      type: 'info',
      link: '/supervisor/locations',
    });

    res.json({ success: true, studentId, locationId, locationName: location.name });
  } catch (error) {
    res.status(500).json({ message: 'Server error while assigning location' });
  }
};

export const submitCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findById(req.user._id);
    const checkInData = {
      ...req.body,
      studentId: req.user._id,
      studentName: student?.name || req.body.studentName || 'Student',
      timestamp: new Date(),
    };

    const checkIn = await CheckIn.create(checkInData);
    res.status(201).json(checkIn);
  } catch (error) {
    res.status(500).json({ message: 'Server error while recording location check-in' });
  }
};

export const getCheckIns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: Record<string, unknown> = {};
    if (req.user.role === 'student') {
      query = { studentId: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const assignedStudents = await User.find({ assignedSupervisorId: req.user._id }).select('_id');
      const studentIds = assignedStudents.map(s => s._id);
      query = { studentId: { $in: studentIds } };
    }
    const checkIns = await CheckIn.find(query).sort({ timestamp: -1 });
    res.json(checkIns);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching check-ins' });
  }
};
