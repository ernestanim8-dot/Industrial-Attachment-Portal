import { Router } from 'express';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  assignStudentLocation,
  submitCheckIn,
  getCheckIns,
} from '../controllers/locationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getLocations);
router.post('/', createLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);
router.post('/assign', assignStudentLocation);
router.post('/check-in', submitCheckIn);
router.get('/check-ins', getCheckIns);

export default router;
