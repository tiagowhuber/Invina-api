import express from 'express';
import { eventsController } from '../controllers/eventsController';
import { validateCreateEvent, validateUpdateEvent, validateId, validate } from '../middleware/validators';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', eventsController.getAllEvents);

// GET /api/events/availability - Get events with availability
router.get('/availability', eventsController.getEventsWithAvailability);

// GET /api/events/:id - Get event by ID
router.get('/:id', validateId, validate, eventsController.getEventById);

// GET /api/events/:id/availability - Get event with availability
router.get('/:id/availability', validateId, validate, eventsController.getEventWithAvailability);

// POST /api/events - Create new event
router.post('/', validateCreateEvent, validate, eventsController.createEvent);

// PUT /api/events/:id - Update event
router.put('/:id', validateUpdateEvent, validate, eventsController.updateEvent);

// DELETE /api/events/:id - Deactivate event
router.delete('/:id', validateId, validate, eventsController.deleteEvent);

export default router;
