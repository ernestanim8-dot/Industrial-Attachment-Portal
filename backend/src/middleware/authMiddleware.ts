import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
        return;
      }

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401).json({ message: 'User belonging to this token no longer exists' });
        return;
      }

      req.user = user;
      next();
      return;
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, invalid or expired token' });
      return;
    }
  }

  res.status(401).json({ message: 'Not authorized, no token provided' });
};

export const authMiddleware = protect;
