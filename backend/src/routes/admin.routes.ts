import { Router } from 'express';
import {
  getDashboardStats,
  getAllAdvertisements,
  updateAdStatus,
  toggleFeatured,
  getUsers,
  updateUserStatus,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  getAllReports,
  updateReportStatus,
  getAuditLogs
} from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Advertisement moderation
router.get('/advertisements', getAllAdvertisements);
router.patch('/advertisements/:id/status', updateAdStatus);
router.put('/advertisements/:id/status', updateAdStatus);
router.patch('/advertisements/:id/featured', toggleFeatured);

// Users moderation
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Category management
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/subcategories', createSubcategory);

// Reports
router.get('/reports', getAllReports);
router.patch('/reports/:id', updateReportStatus);
router.put('/reports/:id', updateReportStatus);
router.patch('/reports/:id/status', updateReportStatus);
router.put('/reports/:id/status', updateReportStatus);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
