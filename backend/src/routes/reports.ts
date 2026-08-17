import { Router } from 'express';
import { submitReport, getReports, getReportById, updateReport, exportReports } from '../controllers/reportController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // All report routes are protected

router.post('/', submitReport);
router.get('/', getReports);
router.get('/export/csv', exportReports);
router.get('/:id', getReportById);
router.put('/:id', updateReport);

export default router;
