import { Router } from 'express';
import { PaymentsController } from '../controllers/PaymentsController';

const router = Router();
const controller = new PaymentsController();

// Transbank returns here (POST mostly, sometimes GET)
router.post('/return', controller.handleReturn);
router.get('/return', controller.handleReturn);

// Frontend verification
router.get('/verify/:token', controller.verify);

// Test Mode bypass route
router.get('/test-success', controller.handleTestSuccess);

// Cron Job
router.get('/expire-orders', controller.expireOrders);

export default router;
