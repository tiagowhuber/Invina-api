import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import Tour from '../models/Tour';
import TourInstance from '../models/TourInstance';
import Order from '../models/Order';
import Ticket from '../models/Ticket';
import Wine from '../models/Wine';
import TourWine from '../models/TourWine';
import OrderWine from '../models/OrderWine';
import { generateOrderNumber, generateTicketNumber } from '../utils/generators';
import { ApiResponse, CreateBookingRequest } from '../types';

// Create a new booking
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const bookingData: CreateBookingRequest = req.body;
    const {
      tour_id,
      instance_date,
      instance_time,
      ticket_quantity,
      wine_ids,
      customer_name,
      customer_email,
      customer_phone,
    } = bookingData;

    // 1. Validate tour exists and is active
    const tour = await Tour.findOne({
      where: { id: tour_id, is_active: true },
      transaction,
    });

    if (!tour) {
      await transaction.rollback();
      const response: ApiResponse = {
        success: false,
        error: 'Tour not found or not active',
      };
      res.status(404).json(response);
      return;
    }

    // 2. Validate ticket quantity meets minimum requirement
    if (ticket_quantity < tour.min_tickets) {
      await transaction.rollback();
      const response: ApiResponse = {
        success: false,
        error: `Minimum ${tour.min_tickets} tickets required for this tour`,
      };
      res.status(400).json(response);
      return;
    }

    // 3. Validate wine selections based on tour type
    if (tour.tour_type === 'option_1') {
      // Wine selection required for option_1
      if (!wine_ids || wine_ids.length === 0) {
        await transaction.rollback();
        const response: ApiResponse = {
          success: false,
          error: 'Wine selection is required for this tour type',
        };
        res.status(400).json(response);
        return;
      }

      // Validate all selected wines exist in tour_wines for this tour
      const tourWines = await TourWine.findAll({
        where: { tour_id: tour_id },
        attributes: ['wine_id'],
        transaction,
      });

      const validWineIds = tourWines.map((tw) => tw.wine_id);
      const invalidWines = wine_ids.filter((id) => !validWineIds.includes(id));

      if (invalidWines.length > 0) {
        await transaction.rollback();
        const response: ApiResponse = {
          success: false,
          error: `Invalid wine selections: ${invalidWines.join(', ')}. These wines are not available for this tour.`,
        };
        res.status(400).json(response);
        return;
      }
    } else {
      // Wine selection forbidden for option_2 and option_3
      if (wine_ids && wine_ids.length > 0) {
        await transaction.rollback();
        const response: ApiResponse = {
          success: false,
          error: 'Wine selection is not allowed for this tour type',
        };
        res.status(400).json(response);
        return;
      }
    }

    // 4. Handle tour_instance based on tour type
    let tourInstance: TourInstance;

    if (tour.tour_type === 'option_3') {
      // For option_3, reuse existing instance or create new one
      const [instance, _created] = await TourInstance.findOrCreate({
        where: {
          tour_id: tour_id,
          instance_date: instance_date,
          status: 'active',
        },
        defaults: {
          tour_id: tour_id,
          instance_date: instance_date,
          instance_time: instance_time,
          capacity: tour.max_capacity,
          tickets_sold: 0,
          status: 'active',
        },
        transaction,
      });

      tourInstance = instance;
    } else {
      // For option_1 and option_2, always create new instance
      tourInstance = await TourInstance.create(
        {
          tour_id: tour_id,
          instance_date: instance_date,
          instance_time: instance_time,
          capacity: tour.max_capacity,
          tickets_sold: 0,
          status: 'active',
        },
        { transaction }
      );
    }

    // 5. Check capacity with row-level locking
    const lockedInstance = await TourInstance.findOne({
      where: { id: tourInstance.id },
      lock: true,
      transaction,
    });

    if (!lockedInstance) {
      await transaction.rollback();
      const response: ApiResponse = {
        success: false,
        error: 'Tour instance not found',
      };
      res.status(500).json(response);
      return;
    }

    if (lockedInstance.tickets_sold + ticket_quantity > lockedInstance.capacity) {
      await transaction.rollback();
      const response: ApiResponse = {
        success: false,
        error: `Not enough capacity. Only ${lockedInstance.capacity - lockedInstance.tickets_sold} tickets available.`,
      };
      res.status(400).json(response);
      return;
    }

    // 6. Calculate total amount
    const total_amount = parseFloat(tour.base_price.toString()) * ticket_quantity;

    // 7. Create order
    const order_number = generateOrderNumber();
    const order = await Order.create(
      {
        order_number: order_number,
        tour_instance_id: tourInstance.id,
        customer_name: customer_name,
        customer_email: customer_email,
        customer_phone: customer_phone,
        ticket_quantity: ticket_quantity,
        total_amount: total_amount,
        status: 'pending',
      },
      { transaction }
    );

    // 8. Create tickets
    const tickets = [];
    for (let i = 0; i < ticket_quantity; i++) {
      const ticket_number = generateTicketNumber();
      const ticket = await Ticket.create(
        {
          order_id: order.id,
          ticket_number: ticket_number,
          status: 'reserved',
        },
        { transaction }
      );
      tickets.push(ticket);
    }

    // 9. Create order_wines records (only for option_1)
    if (tour.tour_type === 'option_1' && wine_ids && wine_ids.length > 0) {
      for (const wine_id of wine_ids) {
        await OrderWine.create(
          {
            order_id: order.id,
            wine_id: wine_id,
          },
          { transaction }
        );
      }
    }

    // 10. Increment tickets_sold on tour_instance
    await lockedInstance.increment('tickets_sold', {
      by: ticket_quantity,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    // 11. Fetch complete order details to return
    const completeOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        {
          model: TourInstance,
          as: 'tour_instance',
          include: [
            {
              model: Tour,
              as: 'tour',
            },
          ],
        },
        {
          model: Ticket,
          as: 'tickets',
        },
        {
          model: Wine,
          as: 'wines',
        },
      ],
    });

    const response: ApiResponse = {
      success: true,
      message: 'Booking created successfully',
      data: completeOrder,
    };

    res.status(201).json(response);
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error creating booking:', error);

    // Handle unique constraint violation for option_3
    if (error.name === 'SequelizeUniqueConstraintError') {
      const response: ApiResponse = {
        success: false,
        error: 'A booking conflict occurred. Please try again.',
      };
      res.status(409).json(response);
      return;
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to create booking',
    };
    res.status(500).json(response);
  }
};

// Get order by order number
export const getOrderByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      where: { order_number: orderNumber },
      include: [
        {
          model: TourInstance,
          as: 'tour_instance',
          include: [
            {
              model: Tour,
              as: 'tour',
            },
          ],
        },
        {
          model: Ticket,
          as: 'tickets',
        },
        {
          model: Wine,
          as: 'wines',
        },
      ],
    });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Order not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: order,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch order',
    };
    res.status(500).json(response);
  }
};
