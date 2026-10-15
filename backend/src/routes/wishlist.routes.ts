import { Router } from 'express';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getWishlist);
router.post('/:adId', authenticateToken, toggleWishlist);
router.post('/:adId/toggle', authenticateToken, toggleWishlist);

export default router;
