const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { authenticateToken } = require('../middleware/auth');
const { requireSeller } = require('../middleware/rbac');

router.post('/', authenticateToken, enquiryController.createEnquiry);
router.get('/buyer', authenticateToken, enquiryController.getBuyerEnquiries);
router.get('/seller', authenticateToken, requireSeller, enquiryController.getSellerEnquiries);
router.post('/:id/reply', authenticateToken, requireSeller, enquiryController.replyEnquiry);

module.exports = router;
