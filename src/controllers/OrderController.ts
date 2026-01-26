import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PricingService } from '../services/PricingService';
import { PaymentService } from '../services/PaymentService';
import Order from '../models/Order';
import Payment from '../models/Payment';
import TourInstance from '../models/TourInstance';
import Tour from '../models/Tour';
import { sequelize } from '../config/database';

export class OrderController {
  private pricingService = new PricingService();
  private paymentService = new PaymentService();

  createOrder = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { tourId, date, time, customerName, customerEmail, customerPhone, attendeesCount } = req.body;
    
    const t = await sequelize.transaction();

    try {
      // 1. Ensure Tour Instance Exists or Create it
      let instance = await TourInstance.findOne({
        where: {
          tourId,
          instanceDate: date,
          startTime: time
        },
        transaction: t
      });

      if (!instance) {
        instance = await TourInstance.create({
          tourId,
          instanceDate: date,
          startTime: time,
          currentAttendants: 0 
        }, { transaction: t });
      }

      // Check capacity
      const tour = await Tour.findByPk(tourId);
      if (instance.currentAttendants + attendeesCount > tour!.maxAttendants) {
         await t.rollback();
         res.status(400).json({ error: 'Not enough capacity' });
         return;
      }

      // 2. Calculate Price
      const totalAmount = await this.pricingService.calculatePrice(tourId, attendeesCount);

      // 3. Create Order
      const order = await Order.create({
        tourInstanceId: instance.id,
        customerName,
        customerEmail,
        customerPhone,
        attendeesCount,
        totalAmount,
        status: 'Pending'
      }, { transaction: t });

      // TEST MODE CHECK
      if (process.env.SKIP_PAYMENT === 'true') {
        order.status = 'Confirmed';
        await order.save({ transaction: t });

        await Payment.create({
            orderId: order.id,
            provider: 'TEST_SKIP',
            transactionId: `SKIP-${order.orderNumber}`,
            amount: totalAmount,
            status: 'Completed',
            responsePayload: { message: 'Payment skipped via env var' }
        }, { transaction: t });

        await t.commit();

        res.json({
            orderNumber: order.orderNumber,
            // Point to a backend route that simply redirects to frontend success
            paymentUrl: `${process.env.API_URL}/api/payments/test-success?order=${order.orderNumber}`,
            token: 'SKIP_TOKEN',
            amount: totalAmount
        });
        return;
      }

      await t.commit();

      // 4. Initiate Payment
      const paymentResponse = await this.paymentService.createTransaction(order);

      // Return payment URL to frontend
      res.json({
        orderNumber: order.orderNumber,
        paymentUrl: paymentResponse.url,
        token: paymentResponse.token,
        amount: totalAmount
      });

    } catch (err: any) {
      await t.rollback();
      res.status(500).json({ error: err.message });
    }
  };
}
