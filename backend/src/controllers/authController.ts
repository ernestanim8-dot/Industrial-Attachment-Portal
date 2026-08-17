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
    
    // Protect Admin and Supervisor account creation
    if ((role === 'admin' || role === 'supervisor') && accessCode !== 'TTU-STAFF-2026') {
      res.status(403).json({ message: 'Invalid or missing Staff Access Code for staff account registration.' });
      return;
    }

    // Staff accounts must provide a phone number
    if ((role === 'admin' || role === 'supervisor') && !phone) {
      res.status(400).json({ message: 'A phone number is required for Admin and Supervisor accounts.' });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, passwordHash, role, department, phone });

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
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      // Staff roles (admin / supervisor) require SMS OTP verification
      if (user.role === 'admin' || user.role === 'supervisor') {
        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Persist OTP on the user document
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Simulate SMS delivery
        const phone = user.phone || 'N/A (no phone on file)';
        sendSmsOtp(phone, otp, user.name);

        res.json({
          requiresOtp: true,
          userId: user._id.toString(),
          maskedPhone: user.phone
            ? `+${'*'.repeat(user.phone.length - 4)}${user.phone.slice(-4)}`
            : null,
        });
        return;
      }

      // Students log straight in — no OTP needed
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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

    if (!userId || !otp) {
      res.status(400).json({ message: 'User ID and OTP are required.' });
      return;
    }

    const user = await User.findById(userId);

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

    if (user.otp !== otp.toString().trim()) {
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

