import { Router } from 'express';
import {
  createBooking,
  getOrderByNumber,
} from '../controllers/bookingsController';
import { validate, validateBookingRequest } from '../middleware/validators';

const router = Router();

// POST /api/bookings - Create a booking
router.post('/', validateBookingRequest, validate, createBooking);

// GET /api/bookings/:orderNumber - Get booking by order number
router.get('/:orderNumber', getOrderByNumber);

export default router;
