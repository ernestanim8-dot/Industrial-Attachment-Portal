import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
};

/** Generate a random 6-digit OTP string */
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/** Simulate sending an SMS — in production replace with Twilio/Arkesel API */
const sendSmsOtp = (phone: string, otp: string, name: string): void => {
  console.log('\n========================================');
  console.log('📱 [SMS SIMULATION]');
  console.log(`To: ${phone}`);
  console.log(`Recipient: ${name}`);
  console.log(`Message: Your TTU Portal verification code is: ${otp}`);
  console.log(`(Expires in 5 minutes)`);
  console.log('========================================\n');
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department, phone, accessCode } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof role !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      password.length < 6
    ) {
      res.status(400).json({ message: 'Invalid input. Name, valid email, and password (min 6 chars) are required.' });
      return;
    }
    
    // Protect Admin and Supervisor account creation
    const configuredStaffCode = process.env.STAFF_ACCESS_CODE || (process.env.NODE_ENV === 'production' ? undefined : 'TTU-STAFF-2026');
    if (role === 'admin' || role === 'supervisor') {
      if (!configuredStaffCode || accessCode !== configuredStaffCode) {
        res.status(403).json({ message: 'Invalid or unconfigured Staff Access Code for staff registration.' });
        return;
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const validRoles = ['student', 'supervisor', 'admin'];
    const userRole = (validRoles.includes(role) ? role : 'student') as 'student' | 'supervisor' | 'admin';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ 
      name: name.trim(), 
      email: normalizedEmail, 
      passwordHash, 
      role: userRole, 
      department, 
      phone: phone ? phone.trim() : undefined 
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp || typeof userId !== 'string' || typeof otp !== 'string') {
      res.status(400).json({ message: 'User ID and OTP are required.' });
      return;
    }

    const user = await User.findById(userId).select('+otp +otpExpiry');

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (!user.otp || !user.otpExpiry) {
      res.status(400).json({ message: 'No OTP was requested. Please log in again.' });
      return;
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      res.status(400).json({ message: 'OTP has expired. Please log in again.' });
      return;
    }

    if (user.otp !== otp.trim()) {
      res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      return;
    }

    // OTP is valid — clear it and issue full JWT
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const user = await User.findById(req.user.id).select('-passwordHash -otp -otpExpiry');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

