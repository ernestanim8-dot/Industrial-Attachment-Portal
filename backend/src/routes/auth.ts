import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, verifyOtp } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Rate limiter for authentication routes: max 15 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.get('/me', protect, getMe);

export default router;

