const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireSeller } = require('../middleware/rbac');
const upload = require('../middleware/upload');

// Public endpoints
router.get('/', optionalAuth, adController.getAdvertisements);
router.get('/featured', adController.getFeaturedAds);
router.get('/seller/my-ads', authenticateToken, requireSeller, adController.getMyAdvertisements);
router.get('/:id', optionalAuth, adController.getAdvertisementById);

// Seller protected endpoints
router.post('/', authenticateToken, requireSeller, upload.array('images', 6), adController.createAdvertisement);
router.put('/:id', authenticateToken, requireSeller, adController.updateAdvertisement);
router.delete('/:id', authenticateToken, requireSeller, adController.deleteAdvertisement);
router.patch('/:id/sold', authenticateToken, requireSeller, adController.markAsSold);

module.exports = router;
