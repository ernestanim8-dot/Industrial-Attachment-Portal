import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Notification from '../models/Notification';

export const getAssignedStudents: RequestHandler = async function(req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    if (authReq.user.role !== 'supervisor') {
      res.status(403).json({ message: 'Only supervisors can access this route' });
      return;
    }

    const students = await User.find({ 
      role: 'student', 
      assignedSupervisorId: authReq.user._id 
    }).select('-passwordHash');

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching assigned students' });
  }
};

export const getAllUsers: RequestHandler = async function(req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    if (authReq.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can access all users' });
      return;
    }

    const users = await User.find({}).select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

export const assignSupervisor: RequestHandler = async function(req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    if (authReq.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can assign supervisors' });
      return;
    }
    const { supervisorId } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { assignedSupervisorId: supervisorId }, { new: true }).select('-passwordHash');
    
    // Notify student
    if (user) {
      const supervisor = await User.findById(supervisorId);
      await Notification.create({
        recipientId: user._id,
        message: `You have been assigned to supervisor: ${supervisor?.name || 'Assigned'}`,
        type: 'supervisor_assigned'
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error while assigning supervisor' });
  }
};

export const deleteUser: RequestHandler = async function(req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    if (authReq.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can delete users' });
      return;
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

export const updateUserProfile: RequestHandler = async function(req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const targetUserId = req.params.id || authReq.user._id;

    // Allow user to update their own profile, or admin to update any profile
    if (authReq.user.role !== 'admin' && authReq.user._id.toString() !== targetUserId.toString()) {
      res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
      return;
    }

    const { phone, department, name } = req.body;
    const updates: Record<string, unknown> = {};
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;
    if (name !== undefined && typeof name === 'string' && name.trim()) updates.name = name.trim();

    const updatedUser = await User.findByIdAndUpdate(targetUserId, updates, { new: true }).select('-passwordHash');
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

