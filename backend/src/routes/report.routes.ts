import { Router } from 'express';
import { submitReport } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, submitReport);

export default router;
