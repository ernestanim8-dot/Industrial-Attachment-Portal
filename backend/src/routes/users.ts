import { Router } from 'express';
import { getAssignedStudents, getAllUsers, assignSupervisor, deleteUser, updateUserProfile, getSupervisors } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/assigned-students', getAssignedStudents);
router.get('/supervisors', getSupervisors);
router.get('/', getAllUsers);
router.put('/profile', updateUserProfile);
router.put('/:id/profile', updateUserProfile);
router.put('/:id/assign-supervisor', assignSupervisor);
router.put('/:id/assign', assignSupervisor);
router.delete('/:id', deleteUser);

export default router;
