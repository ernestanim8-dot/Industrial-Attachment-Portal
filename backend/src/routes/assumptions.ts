import { Router } from 'express';
import { submitAssumption, getAssumptions, updateAssumptionStatus } from '../controllers/assumptionController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', submitAssumption);
router.get('/', getAssumptions);
router.patch('/:id/status', updateAssumptionStatus);

export default router;
