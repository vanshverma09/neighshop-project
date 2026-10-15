const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// Secure all admin routes
router.use(authenticateToken, requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Advertisements management
router.get('/advertisements', adminController.getAllAdvertisements);
router.patch('/advertisements/:id/status', adminController.updateAdStatus);
router.patch('/advertisements/:id/featured', adminController.toggleFeatured);

// User & Seller management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Category & Subcategory taxonomy
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.post('/subcategories', adminController.createSubcategory);

// Reports & Complaints
router.get('/reports', adminController.getAllReports);
router.patch('/reports/:id/status', adminController.updateReportStatus);

// Audit Activity Logs
router.get('/logs', adminController.getAuditLogs);

module.exports = router;
