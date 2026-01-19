import { Request, Response, NextFunction } from 'express';
import { webpayConfig } from '../config/webpay';
import Order from '../models/Order';
import Ticket from '../models/Ticket';
import WebPayTransactionModel from '../models/WebPayTransaction';
import { generateBuyOrder } from '../utils/generators';
import { checkAndExpireOrder } from '../utils/cronJobs';
import { InitiatePaymentRequest, ConfirmPaymentRequest } from '../types';
import { sequelize } from '../config/database';

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
      const order = await Order.findByPk(order_id);
      
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
      const sessionId = `SESSION-${order.order_number}`;
      const amount = Math.round(parseFloat(order.total_amount.toString()));
      
      // Create transaction with Transbank REST API
      const response = await fetch(webpayConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Tbk-Api-Key-Id': webpayConfig.commerceCode,
          'Tbk-Api-Key-Secret': webpayConfig.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buy_order: buyOrder,
          session_id: sessionId,
          amount: amount,
          return_url: webpayConfig.returnUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transbank API error:', errorText);
        throw new Error(`Failed to create Transbank transaction: ${response.status}`);
      }

      const responseData: any = await response.json();
      
      // Save transaction to database
      await WebPayTransactionModel.create({
        order_id: order.id,
        token: responseData.token,
        buy_order: buyOrder,
        amount: amount,
        status: 'pending',
      });
      
      res.json({
        success: true,
        message: 'WebPay transaction initiated',
        data: {
          token: responseData.token,
          url: responseData.url + '?token_ws=' + responseData.token,
        },
      });
    } catch (error) {
      console.error('WebPay initiate error:', error);
      next(error);
    }
  },

  // POST /api/webpay/confirm - Confirm WebPay transaction (not used with REST API, kept for compatibility)
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
      
      // Commit transaction with Transbank REST API
      const response = await fetch(`${webpayConfig.apiUrl}/${token}`, {
        method: 'PUT',
        headers: {
          'Tbk-Api-Key-Id': webpayConfig.commerceCode,
          'Tbk-Api-Key-Secret': webpayConfig.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Transbank API returned status ${response.status}`);
      }

      const json: any = await response.json();
      
      // Determine transaction status based on Transbank response
      let transactionStatus: 'approved' | 'rejected' | 'failed' = 'failed';
      if (json.status === 'AUTHORIZED' && json.response_code === 0) {
        transactionStatus = 'approved';
      } else if (json.status === 'FAILED' || json.status === 'REJECTED') {
        transactionStatus = 'rejected';
      }
      
      // Update transaction in database
      await WebPayTransactionModel.updateWithResponse(token, {
        status: transactionStatus,
        response_code: json.response_code?.toString(),
        authorization_code: json.authorization_code,
        transaction_date: json.transaction_date ? new Date(json.transaction_date) : new Date(),
        raw_response: json,
      });
      
      // If approved, confirm the order
      if (transactionStatus === 'approved') {
        await sequelize.transaction(async (t) => {
          await Order.update(
            { status: 'paid' },
            { where: { id: transaction.orderId }, transaction: t }
          );
          await Ticket.update(
            { status: 'confirmed' },
            { where: { order_id: transaction.orderId }, transaction: t }
          );
        });
      }
      
      res.json({
        success: true,
        message: 'Transaction confirmed',
        data: {
          status: transactionStatus,
          response_code: json.response_code,
          authorization_code: json.authorization_code,
          amount: json.amount,
          buy_order: json.buy_order,
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
        // Commit transaction with Transbank REST API
        const response = await fetch(`${webpayConfig.apiUrl}/${token}`, {
          method: 'PUT',
          headers: {
            'Tbk-Api-Key-Id': webpayConfig.commerceCode,
            'Tbk-Api-Key-Secret': webpayConfig.apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Transbank API returned status ${response.status}`);
        }

        const json: any = await response.json();
        
        // Determine transaction status
        let transactionStatus: 'approved' | 'rejected' | 'failed' = 'failed';
        if (json.status === 'AUTHORIZED' && json.response_code === 0) {
          transactionStatus = 'approved';
        } else if (json.status === 'FAILED' || json.status === 'REJECTED') {
          transactionStatus = 'rejected';
        }
        
        // Update transaction in database
        await WebPayTransactionModel.updateWithResponse(token, {
          status: transactionStatus,
          response_code: json.response_code?.toString(),
          authorization_code: json.authorization_code,
          transaction_date: json.transaction_date ? new Date(json.transaction_date) : new Date(),
          raw_response: json,
        });
        
        // If approved, confirm the order
        if (transactionStatus === 'approved') {
          await sequelize.transaction(async (t) => {
            await Order.update(
              { status: 'paid' },
              { where: { id: transaction.orderId }, transaction: t }
            );
            await Ticket.update(
              { status: 'confirmed' },
              { where: { order_id: transaction.orderId }, transaction: t }
            );
          });
        }
        
        // Get order details
        
        const order = await Order.findByPk(transaction.orderId);        // Return HTML response (you can customize this)
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
      
      let transaction = await WebPayTransactionModel.findByToken(token);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
        return;
      }
      
      // If transaction is still pending, commit it with Transbank REST API
      if (transaction.status === 'pending') {
        try {
          const response = await fetch(`${webpayConfig.apiUrl}/${token}`, {
            method: 'PUT',
            headers: {
              'Tbk-Api-Key-Id': webpayConfig.commerceCode,
              'Tbk-Api-Key-Secret': webpayConfig.apiKey,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const json: any = await response.json();
            
            // Determine transaction status
            let transactionStatus: 'approved' | 'rejected' | 'failed' = 'failed';
            if (json.status === 'AUTHORIZED' && json.response_code === 0) {
              transactionStatus = 'approved';
            } else if (json.status === 'FAILED' || json.status === 'REJECTED') {
              transactionStatus = 'rejected';
            }
            
            // Update transaction in database
            await WebPayTransactionModel.updateWithResponse(token, {
              status: transactionStatus,
              response_code: json.response_code?.toString(),
              authorization_code: json.authorization_code,
              transaction_date: json.transaction_date ? new Date(json.transaction_date) : new Date(),
              raw_response: json,
            });
            
            // If approved, confirm the order
            if (transactionStatus === 'approved' && transaction) {
              const orderId = transaction.orderId; // Capture to avoid null issues
              await sequelize.transaction(async (t) => {
                await Order.update(
                  { status: 'paid' },
                  { where: { id: orderId }, transaction: t }
                );
                await Ticket.update(
                  { status: 'confirmed' },
                  { where: { order_id: orderId }, transaction: t }
                );
              });
            }
            
            // Fetch updated transaction
            transaction = await WebPayTransactionModel.findByToken(token);
          }
        } catch (error: any) {
          console.error('WebPay commit error:', error);
          // Continue with existing transaction data
        }
      }
      
      // Get order details
      const order = await Order.findByPk(transaction!.orderId);
      
      // Convert Sequelize model to plain object
      const transactionData: any = transaction!;
      
      res.json({
        success: true,
        data: {
          id: transactionData.id,
          order_id: transactionData.orderId,
          token: transactionData.token,
          buy_order: transactionData.buyOrder,
          amount: transactionData.amount,
          status: transactionData.status,
          response_code: transactionData.responseCode,
          authorization_code: transactionData.authorizationCode,
          transaction_date: transactionData.transactionDate,
          created_at: transactionData.createdAt,
          updated_at: transactionData.updatedAt,
          order_number: order?.order_number,
          order_status: order?.status,
        },
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
