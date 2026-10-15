import { Router } from 'express';
import { register, login, logout, getProfile, updateProfile, switchRole } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/switch-role', authenticateToken, switchRole);

export default router;

