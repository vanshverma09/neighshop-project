const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, wishlistController.getWishlist);
router.post('/:adId', authenticateToken, wishlistController.toggleWishlist);

module.exports = router;
