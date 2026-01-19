import { Router } from 'express';
import {
  getAllTours,
  getTourById,
  getTourWines,
  getAvailability,
} from '../controllers/toursController';
import { validate, validateId, validateAvailabilityQuery } from '../middleware/validators';

const router = Router();

// GET /api/tours - Get all active tours
router.get('/', getAllTours);

// GET /api/tours/:id - Get tour by ID
router.get('/:id', validateId, validate, getTourById);

// GET /api/tours/:id/wines - Get available wines for a tour
router.get('/:id/wines', validateId, validate, getTourWines);

// GET /api/tours/:id/availability?date=YYYY-MM-DD - Check available times and capacity
router.get('/:id/availability', validateAvailabilityQuery, validate, getAvailability);

export default router;
