import { Request, Response, NextFunction } from 'express';
import OrderModel from '../models/Order';
import EventModel from '../models/Event';
import { generateOrderNumber, generateTicketNumber } from '../utils/generators';
import { CreateOrderRequest } from '../types';

export const ordersController = {
  // GET /api/orders - Get all orders
  async getAllOrders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await OrderModel.findAll();
      
      // Convert Sequelize models to plain objects
      const ordersData = orders.map((order: any) => ({
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        total_amount: order.totalAmount,
        status: order.status,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
      }));
      
      res.json({
        success: true,
        data: ordersData,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/:id - Get order by ID with details
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderModel.findByIdWithDetails(parseInt(id));
      
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/number/:orderNumber - Get order by order number
  async getOrderByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const order = await OrderModel.findByOrderNumber(orderNumber);
      
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }
      
      // Get full details
      const orderDetails = await OrderModel.findByIdWithDetails(order.id);
      
      res.json({
        success: true,
        data: orderDetails,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/customer/:email - Get orders by customer email
  async getOrdersByEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.params;
      const orders = await OrderModel.findByCustomerEmail(email);
      
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/orders - Create new order
  async createOrder(req: Request<{}, {}, CreateOrderRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customer_name, customer_email, customer_phone, tickets } = req.body;
      
      // Validate tickets array
      if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
        res.status(400).json({
          success: false,
          message: 'At least one ticket is required',
        });
        return;
      }
      
      // Check event availability and calculate total
      let totalAmount = 0;
      const eventChecks = [];
      
      for (const ticket of tickets) {
        const event = await EventModel.findById(ticket.event_id);
        
        if (!event) {
          res.status(404).json({
            success: false,
            message: `Event with ID ${ticket.event_id} not found`,
          });
          return;
        }
        
        if (!event.isActive) {
          res.status(400).json({
            success: false,
            message: `Event "${event.name}" is not active`,
          });
          return;
        }
        
        eventChecks.push(event);
        totalAmount += parseFloat(event.price.toString());
      }
      
      // Group tickets by event to check capacity
      const eventTicketCounts: Record<number, number> = {};
      for (const ticket of tickets) {
        eventTicketCounts[ticket.event_id] = (eventTicketCounts[ticket.event_id] || 0) + 1;
      }
      
      // Check capacity for each event
      for (const [eventIdStr, count] of Object.entries(eventTicketCounts)) {
        const eventId = parseInt(eventIdStr);
        const hasCapacity = await EventModel.checkCapacity(eventId, count);
        if (!hasCapacity) {
          const event = eventChecks.find(e => e.id === eventId);
          res.status(400).json({
            success: false,
            message: `Not enough capacity for event "${event?.name}"`,
          });
          return;
        }
      }
      
      // Generate order number
      const orderNumber = generateOrderNumber();
      
      // Prepare order data
      const orderData = {
        order_number: orderNumber,
        customer_name,
        customer_email,
        customer_phone: customer_phone || undefined,
        total_amount: totalAmount,
        status: 'pending' as const,
      };
      
      // Prepare tickets data
      const ticketsData = tickets.map(ticket => ({
        event_id: ticket.event_id,
        ticket_number: generateTicketNumber(),
        attendee_name: ticket.attendee_name || customer_name,
        status: 'reserved',
      }));
      
      // Create order with tickets
      const result = await OrderModel.create(orderData, ticketsData);
      
      // Get the full order with details
      const orderWithDetails = await OrderModel.findByIdWithDetails(result.order.id);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: orderWithDetails,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/orders/:id/cancel - Cancel order
  async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const order = await OrderModel.findById(parseInt(id));
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }
      
      if (order.status === 'paid') {
        res.status(400).json({
          success: false,
          message: 'Cannot cancel a paid order',
        });
        return;
      }
      
      if (order.status === 'cancelled' || order.status === 'expired') {
        res.status(400).json({
          success: false,
          message: 'Order is already cancelled or expired',
        });
        return;
      }
      
      await OrderModel.cancel(parseInt(id));
      
      res.json({
        success: true,
        message: 'Order cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
