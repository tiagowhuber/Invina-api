import { Request, Response, NextFunction } from 'express';
import { webpayPlus, webpayConfig } from '../config/webpay';
import OrderModel from '../models/Order';
import WebPayTransactionModel from '../models/WebPayTransaction';
import { generateBuyOrder } from '../utils/generators';
import { checkAndExpireOrder } from '../utils/cronJobs';
import { InitiatePaymentRequest, ConfirmPaymentRequest } from '../types';

export const webpayController = {
  // POST /api/webpay/initiate - Initiate WebPay transaction
  async initiateTransaction(req: Request<{}, {}, InitiatePaymentRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { order_id } = req.body;
      
      if (!order_id) {
        res.status(400).json({
          success: false,
          message: 'Order ID is required',
        });
        return;
      }
      
      // Get order details
      const order = await OrderModel.findById(order_id);
      
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }
      
      // Check if order has expired and expire it if necessary
      const wasExpired = await checkAndExpireOrder(order_id);
      if (wasExpired) {
        res.status(400).json({
          success: false,
          message: 'Order has expired',
        });
        return;
      }
      
      if (order.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: `Cannot process payment for order with status: ${order.status}`,
        });
        return;
      }
      
      // Generate buy order
      const buyOrder = generateBuyOrder();
      const sessionId = `SESSION-${order.orderNumber}`;
      const amount = Math.round(parseFloat(order.totalAmount.toString()));
      const returnUrl = webpayConfig.returnUrl;
      
      // Create WebPay transaction
      const response = await webpayPlus.create(
        buyOrder,
        sessionId,
        amount,
        returnUrl
      );
      
      // Save transaction to database
      await WebPayTransactionModel.create({
        order_id: order.id,
        token: response.token,
        buy_order: buyOrder,
        amount: amount,
        status: 'pending',
      });
      
      res.json({
        success: true,
        message: 'WebPay transaction initiated',
        data: {
          token: response.token,
          url: response.url,
        },
      });
    } catch (error) {
      console.error('WebPay initiate error:', error);
      next(error);
    }
  },

  // POST /api/webpay/confirm - Confirm WebPay transaction
  async confirmTransaction(req: Request<{}, {}, ConfirmPaymentRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }
      
      // Get transaction from database
      const transaction = await WebPayTransactionModel.findByToken(token);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
        return;
      }
      
      // Commit transaction with WebPay
      const response = await webpayPlus.commit(token);
      
      // Determine transaction status
      let transactionStatus: 'approved' | 'rejected' | 'failed' = 'failed';
      if (response.response_code === 0) {
        transactionStatus = 'approved';
      } else if (response.response_code === -1) {
        transactionStatus = 'rejected';
      }
      
      // Update transaction in database
      await WebPayTransactionModel.updateWithResponse(token, {
        status: transactionStatus,
        response_code: response.response_code?.toString(),
        authorization_code: response.authorization_code,
        transaction_date: response.transaction_date ? new Date(response.transaction_date) : new Date(),
        raw_response: response,
      });
      
      // If approved, confirm the order
      if (transactionStatus === 'approved') {
        await OrderModel.confirm(transaction.orderId);
      }
      
      res.json({
        success: true,
        message: 'Transaction confirmed',
        data: {
          status: transactionStatus,
          response_code: response.response_code,
          authorization_code: response.authorization_code,
          amount: response.amount,
          buy_order: response.buy_order,
        },
      });
    } catch (error) {
      console.error('WebPay confirm error:', error);
      next(error);
    }
  },

  // GET/POST /api/webpay/return - WebPay return callback
  async handleReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Token can come from query (GET) or body (POST)
      const token = req.query.token_ws as string || req.body.token_ws as string;
      
      if (!token) {
        res.status(400).send('Token not provided');
        return;
      }
      
      // Get transaction from database
      const transaction = await WebPayTransactionModel.findByToken(token);
      
      if (!transaction) {
        res.status(404).send('Transaction not found');
        return;
      }
      
      try {
        // Commit transaction with WebPay
        const response = await webpayPlus.commit(token);
        
        // Determine transaction status
        let transactionStatus: 'approved' | 'rejected' | 'failed' = 'failed';
        if (response.response_code === 0) {
          transactionStatus = 'approved';
        } else if (response.response_code === -1) {
          transactionStatus = 'rejected';
        }
        
        // Update transaction in database
        await WebPayTransactionModel.updateWithResponse(token, {
          status: transactionStatus,
          response_code: response.response_code?.toString(),
          authorization_code: response.authorization_code,
          transaction_date: response.transaction_date ? new Date(response.transaction_date) : new Date(),
          raw_response: response,
        });
        
        // If approved, confirm the order
        if (transactionStatus === 'approved') {
          await OrderModel.confirm(transaction.orderId);
        }
        
        // Get order details
        
        const order = await OrderModel.findByIdWithDetails(transaction.orderId);        // Return HTML response (you can customize this)
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment ${transactionStatus === 'approved' ? 'Successful' : 'Failed'}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: green; }
              .failed { color: red; }
              .container { max-width: 600px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="${transactionStatus === 'approved' ? 'success' : 'failed'}">
                Payment ${transactionStatus === 'approved' ? 'Successful' : 'Failed'}
              </h1>
              <p><strong>Order Number:</strong> ${order?.order_number}</p>
              <p><strong>Amount:</strong> $${order?.total_amount}</p>
              <p><strong>Status:</strong> ${transactionStatus}</p>
              ${transactionStatus === 'approved' ? 
                '<p>Your tickets have been confirmed and sent to your email.</p>' :
                '<p>Your payment was not approved. Please try again.</p>'
              }
            </div>
          </body>
          </html>
        `;
        
        res.send(html);
      } catch (error: any) {
        console.error('WebPay commit error:', error);
        
        // Update transaction as failed
        await WebPayTransactionModel.updateWithResponse(token, {
          status: 'failed',
          response_code: undefined,
          authorization_code: undefined,
          transaction_date: new Date(),
          raw_response: { error: error.message },
        });
        
        res.status(500).send('Transaction processing failed');
      }
    } catch (error) {
      console.error('WebPay return error:', error);
      next(error);
    }
  },

  // GET /api/webpay/transaction/:token - Get transaction status
  async getTransactionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      
      const transaction = await WebPayTransactionModel.findByToken(token);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/webpay/transactions - Get all transactions
  async getAllTransactions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactions = await WebPayTransactionModel.findAll();
      
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/webpay/statistics - Get transaction statistics
  async getStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statistics = await WebPayTransactionModel.getStatistics();
      
      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  },
};
