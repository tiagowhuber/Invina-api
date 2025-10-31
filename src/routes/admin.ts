import express from 'express';
import { adminController } from '../controllers/adminController';

const router = express.Router();

// POST /api/admin/expire-orders - Manually expire old orders
router.post('/expire-orders', adminController.expireOrders);

// GET /api/admin/health - Admin health check
router.get('/health', adminController.healthCheck);

export default router;
