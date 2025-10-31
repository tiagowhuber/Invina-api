import express from 'express';
import { ticketsController } from '../controllers/ticketsController';
import { validateUpdateAttendee, validateId, validate } from '../middleware/validators';

const router = express.Router();

// GET /api/tickets - Get all tickets
router.get('/', ticketsController.getAllTickets);

// GET /api/tickets/:id - Get ticket by ID
router.get('/:id', validateId, validate, ticketsController.getTicketById);

// GET /api/tickets/number/:ticketNumber - Get ticket by number
router.get('/number/:ticketNumber', ticketsController.getTicketByNumber);

// GET /api/tickets/order/:orderId - Get tickets by order
router.get('/order/:orderId', ticketsController.getTicketsByOrder);

// GET /api/tickets/event/:eventId - Get tickets by event
router.get('/event/:eventId', ticketsController.getTicketsByEvent);

// GET /api/tickets/event/:eventId/statistics - Get event statistics
router.get('/event/:eventId/statistics', ticketsController.getEventStatistics);

// PUT /api/tickets/:id/use - Mark ticket as used
router.put('/:id/use', validateId, validate, ticketsController.useTicket);

// PUT /api/tickets/number/:ticketNumber/use - Mark ticket as used by number
router.put('/number/:ticketNumber/use', ticketsController.useTicketByNumber);

// PUT /api/tickets/:id/attendee - Update attendee name
router.put('/:id/attendee', validateUpdateAttendee, validate, ticketsController.updateAttendee);

export default router;
