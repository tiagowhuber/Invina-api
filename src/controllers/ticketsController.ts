import { Request, Response, NextFunction } from 'express';
import TicketModel from '../models/Ticket';

export const ticketsController = {
  // GET /api/tickets - Get all tickets
  async getAllTickets(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tickets = await TicketModel.findAll();
      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets/:id - Get ticket by ID
  async getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await TicketModel.findById(parseInt(id));
      
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets/number/:ticketNumber - Get ticket by number
  async getTicketByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketNumber } = req.params;
      const ticket = await TicketModel.findByTicketNumber(ticketNumber);
      
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets/order/:orderId - Get tickets by order
  async getTicketsByOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const tickets = await TicketModel.findByOrderId(parseInt(orderId));
      
      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets/event/:eventId - Get tickets by event
  async getTicketsByEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const tickets = await TicketModel.findByEventId(parseInt(eventId));
      
      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tickets/event/:eventId/statistics - Get event ticket statistics
  async getEventStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const statistics = await TicketModel.getEventStatistics(parseInt(eventId));
      
      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/tickets/:id/use - Mark ticket as used
  async useTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const ticket = await TicketModel.findById(parseInt(id));
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
        return;
      }
      
      if (ticket.status !== 'confirmed') {
        res.status(400).json({
          success: false,
          message: `Ticket cannot be used. Current status: ${ticket.status}`,
        });
        return;
      }
      
      const updatedTicket = await TicketModel.updateStatus(parseInt(id), 'used');
      
      res.json({
        success: true,
        message: 'Ticket marked as used',
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/tickets/number/:ticketNumber/use - Mark ticket as used by ticket number
  async useTicketByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketNumber } = req.params;
      
      const ticket = await TicketModel.findByTicketNumber(ticketNumber);
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
        return;
      }
      
      if (ticket.status !== 'confirmed') {
        res.status(400).json({
          success: false,
          message: `Ticket cannot be used. Current status: ${ticket.status}`,
        });
        return;
      }
      
      const updatedTicket = await TicketModel.markAsUsed(ticketNumber);
      
      res.json({
        success: true,
        message: 'Ticket marked as used',
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/tickets/:id/attendee - Update attendee name
  async updateAttendee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { attendee_name } = req.body;
      
      if (!attendee_name) {
        res.status(400).json({
          success: false,
          message: 'Attendee name is required',
        });
        return;
      }
      
      const ticket = await TicketModel.findById(parseInt(id));
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
        return;
      }
      
      const updatedTicket = await TicketModel.updateAttendeeName(parseInt(id), attendee_name);
      
      res.json({
        success: true,
        message: 'Attendee name updated',
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  },
};
