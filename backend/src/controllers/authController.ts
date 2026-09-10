import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { supabase } from '../supabase';

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
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
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

    const rawInput = email.trim();
    const normalizedInput = rawInput.toLowerCase();

    // Fetch user flexibly by exact email, prefix, or phone
    let queryBuilder = supabase.from('users').select('*');
    if (rawInput.includes('@')) {
      queryBuilder = queryBuilder.ilike('email', normalizedInput);
    } else {
      // Support entering just username (e.g. 'admin' or 'john.student') or phone
      queryBuilder = queryBuilder.or(`email.ilike.${normalizedInput}@ttu.edu.gh,email.ilike.${normalizedInput},phone.ilike.%${rawInput}%`);
    }

    const { data: userRows, error: userError } = await queryBuilder.limit(1);
    const userData = userRows && userRows.length > 0 ? userRows[0] : null;

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (userData && userData.password_hash && (await bcrypt.compare(password, userData.password_hash))) {
      res.json({
        _id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        token: generateToken(userData.id),
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

    // Fetch user with otp fields directly
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') throw userError;

    if (!userData) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (!userData.otp || !userData.otp_expiry) {
      res.status(400).json({ message: 'No OTP was requested. Please log in again.' });
      return;
    }

    if (new Date() > new Date(userData.otp_expiry)) {
      // Clear expired OTP
      await supabase
        .from('users')
        .update({ otp: null, otp_expiry: null })
        .eq('id', userId);
      res.status(400).json({ message: 'OTP has expired. Please log in again.' });
      return;
    }

    if (userData.otp !== otp.trim()) {
      res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      return;
    }

    // OTP is valid — clear it and issue full JWT
    await supabase
      .from('users')
      .update({ otp: null, otp_expiry: null })
      .eq('id', userId);

    res.json({
      _id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      token: generateToken(userData.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, phone, assigned_supervisor_id, created_at, updated_at')
      .eq('id', String(userId))
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: data.id,
      _id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      phone: data.phone,
      assignedSupervisorId: data.assigned_supervisor_id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
