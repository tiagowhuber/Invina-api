import { Request, Response, NextFunction } from 'express';
import EventModel from '../models/Event';

export const eventsController = {
  // GET /api/events - Get all events
  async getAllEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await EventModel.findAll();
      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/events/availability - Get events with availability info
  async getEventsWithAvailability(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await EventModel.findAllWithAvailability();
      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/events/:id - Get event by ID
  async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await EventModel.findById(parseInt(id));
      
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/events/:id/availability - Get event with availability
  async getEventWithAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await EventModel.findByIdWithAvailability(parseInt(id));
      
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/events - Create new event
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventData = req.body;
      const event = await EventModel.create(eventData);
      
      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/events/:id - Update event
  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const eventData = req.body;
      
      const event = await EventModel.update(parseInt(id), eventData);
      
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Event updated successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/events/:id - Deactivate event
  async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await EventModel.deactivate(parseInt(id));
      
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Event deactivated successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },
};
