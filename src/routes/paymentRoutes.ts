import { Router } from 'express';
import { PaymentsController } from '../controllers/PaymentsController';

const router = Router();
const controller = new PaymentsController();

// Transbank returns here (POST mostly, sometimes GET)
router.post('/return', controller.handleReturn);
router.get('/return', controller.handleReturn);

// Cron Job
router.get('/expire-orders', controller.expireOrders);

export default router;
