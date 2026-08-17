import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Notification from '../models/Notification';

// Get all notifications for the logged-in user
export const getNotifications: RequestHandler = async function (req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const notifications = await Notification.find({ recipientId: authReq.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Get unread count
export const getUnreadCount: RequestHandler = async function (req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const count = await Notification.countDocuments({ recipientId: authReq.user._id, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
};

// Mark a single notification as read
export const markAsRead: RequestHandler = async function (req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: authReq.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error while marking notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead: RequestHandler = async function (req, res, next): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    await Notification.updateMany(
      { recipientId: authReq.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error while marking all notifications as read' });
  }
};
