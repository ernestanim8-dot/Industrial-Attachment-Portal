import { Router } from 'express';
import { submitAttachmentLetter, getAttachmentLetters, updateAttachmentLetterStatus } from '../controllers/attachmentLetterController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', submitAttachmentLetter);
router.get('/', getAttachmentLetters);
router.patch('/:id/status', updateAttachmentLetterStatus);

export default router;
