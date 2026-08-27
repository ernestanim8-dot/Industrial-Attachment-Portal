import { Router } from 'express';
import { submitDailyReport, getDailyReports, reviewDailyReport } from '../controllers/dailyReportController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', submitDailyReport);
router.get('/', getDailyReports);
router.patch('/:id/review', reviewDailyReport);

export default router;
