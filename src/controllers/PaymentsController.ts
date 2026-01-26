import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import Payment from '../models/Payment';
import Order from '../models/Order';
import { Op } from 'sequelize';
import moment from 'moment';

export class PaymentsController {
  private paymentService = new PaymentService();

  // Webhook/Return from VirtualPOS (Redirect handler)
  handleReturn = async (req: Request, res: Response) => {
    const token = req.query.token as string;
    
    if (!token) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
      return;
    }

    // Just redirect to frontend, let frontend trigger the verification
    res.redirect(`${process.env.FRONTEND_URL}/payment/confirmation?token=${token}`);
  };

  // Called by Frontend to verify status
  verify = async (req: Request, res: Response) => {
      const { token } = req.params;

      try {
        const commitResponse = await this.paymentService.commitTransaction(token);
        
        const payment = await Payment.findOne({ where: { transactionId: token } });
        if (!payment) throw new Error('Payment not found');
  
        const order = await Order.findByPk(payment.orderId);
        if (!order) throw new Error('Order not found');
  
        // Update statuses
        const status = commitResponse.status;
        if (status === 'authorized' || status === 'pagado') {
          payment.status = 'Completed';
          order.status = 'Confirmed';
        } else {
          // If not authorized yet, it might be pending or failed.
          // virtualPos usually returns current status.
          payment.status = (status === 'created' || status === 'pending') ? 'Pending' : 'Failed';
          // Don't cancel order immediately if pending?
          // If failed, cancel order?
          if (payment.status === 'Failed') order.status = 'Cancelled';
        }
        
        payment.responsePayload = commitResponse;
  
        await payment.save();
        await order.save();
  
        res.json({
            status: payment.status,
            order: order,
            details: commitResponse
        });
  
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification failed' });
      }
  }

  handleTestSuccess = async (req: Request, res: Response) => {
    const orderNumber = req.query.order;
    // The frontend submits a POST form here, we just redirect back to the success page.
    res.redirect(`${process.env.FRONTEND_URL}/payment/success?order=${orderNumber}`);
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
