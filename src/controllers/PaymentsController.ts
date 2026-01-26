import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import Payment from '../models/Payment';
import Order from '../models/Order';
import { Op } from 'sequelize';
import moment from 'moment';

export class PaymentsController {
  private paymentService = new PaymentService();

  // Webhook/Return from Transbank
  handleReturn = async (req: Request, res: Response) => {
    const { token_ws } = req.body; 
    const token = token_ws || req.query.token_ws;
    
    if (!token) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/cancel`);
      return;
    }

    try {
      const commitResponse = await this.paymentService.commitTransaction(token as string);
      
      const payment = await Payment.findOne({ where: { transactionId: token as string } });
      if (!payment) throw new Error('Payment not found');

      const order = await Order.findByPk(payment.orderId);
      if (!order) throw new Error('Order not found');

      // Update statuses
      if (commitResponse.status === 'AUTHORIZED') {
        payment.status = 'Completed';
        order.status = 'Confirmed';
        payment.responsePayload = commitResponse;
      } else {
        payment.status = 'Failed';
        order.status = 'Cancelled';
        payment.responsePayload = commitResponse;
      }

      await payment.save();
      await order.save();

      // Redirect to Frontend
      if (order.status === 'Confirmed') {
        res.redirect(`${process.env.FRONTEND_URL}/payment/success?order=${order.orderNumber}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/payment/failure?order=${order.orderNumber}`);
      }

    } catch (err) {
      console.error(err);
      res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
    }
  };

  expireOrders = async (_req: Request, res: Response) => {
    try {
        const timeoutThreshold = moment().subtract(15, 'minutes').toDate();
        
        const expiredOrders = await Order.findAll({
        where: {
            status: 'Pending',
            createdAt: {
            [Op.lt]: timeoutThreshold
            }
        }
        });

        for (const order of expiredOrders) {
        order.status = 'Cancelled';
        await order.save(); 
        }

        res.json({ message: `Expired ${expiredOrders.length} orders` });
    } catch (error) {
        console.error("Cron Error", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
