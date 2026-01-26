import { Router } from 'express';
import { TourController } from '../controllers/TourController';

const router = Router();
const controller = new TourController();

router.get('/', controller.getAllTours);
router.get('/slots', controller.getSlots);

export default router;
