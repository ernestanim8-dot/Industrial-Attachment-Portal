import { Router } from 'express';
import { createAssessment, getAssessmentsByReport, getAllAssessments } from '../controllers/assessmentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', createAssessment);
router.get('/', getAllAssessments);
router.get('/report/:reportId', getAssessmentsByReport);

export default router;
