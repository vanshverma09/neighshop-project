import { Router } from 'express';
import { createEnquiry, getBuyerEnquiries, getSellerEnquiries, replyEnquiry } from '../controllers/enquiryController';
import { authenticateToken } from '../middleware/auth';
import { requireSeller } from '../middleware/rbac';

const router = Router();

router.post('/', authenticateToken, createEnquiry);
router.get('/buyer', authenticateToken, getBuyerEnquiries);
router.get('/seller', authenticateToken, requireSeller, getSellerEnquiries);
router.put('/:id', authenticateToken, requireSeller, replyEnquiry);
router.put('/:id/reply', authenticateToken, requireSeller, replyEnquiry);
router.patch('/:id', authenticateToken, requireSeller, replyEnquiry);
router.patch('/:id/reply', authenticateToken, requireSeller, replyEnquiry);

export default router;
