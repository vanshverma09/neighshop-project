import { Router } from 'express';
import {
  getAdvertisements,
  getFeaturedAds,
  getAdvertisementById,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  markAsSold,
  getMyAdvertisements
} from '../controllers/adController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { requireSeller } from '../middleware/rbac';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', optionalAuth, getAdvertisements);
router.get('/featured', getFeaturedAds);
router.get('/my-ads', authenticateToken, requireSeller, getMyAdvertisements);
router.get('/seller/me', authenticateToken, requireSeller, getMyAdvertisements);
router.get('/:id', optionalAuth, getAdvertisementById);
router.post('/', authenticateToken, requireSeller, upload.array('images', 8), createAdvertisement);
router.put('/:id', authenticateToken, requireSeller, updateAdvertisement);
router.delete('/:id', authenticateToken, deleteAdvertisement);
router.patch('/:id/sold', authenticateToken, requireSeller, markAsSold);

export default router;
