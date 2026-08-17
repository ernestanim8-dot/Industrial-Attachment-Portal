import { Router } from 'express';
import { getAssignedStudents, getAllUsers, assignSupervisor, deleteUser } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/assigned-students', getAssignedStudents);
router.get('/', getAllUsers);
router.put('/:id/assign-supervisor', assignSupervisor);
router.delete('/:id', deleteUser);

export default router;
