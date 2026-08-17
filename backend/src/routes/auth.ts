import { Router } from 'express';
import { register, login, getMe, verifyOtp } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.get('/me', protect, getMe);

export default router;
