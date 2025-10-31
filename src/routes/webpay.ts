import express from 'express';
import { webpayController } from '../controllers/webpayController';
import { validateInitiatePayment, validateConfirmPayment, validate } from '../middleware/validators';

const router = express.Router();

// POST /api/webpay/initiate - Initiate WebPay transaction
router.post('/initiate', validateInitiatePayment, validate, webpayController.initiateTransaction);

// POST /api/webpay/confirm - Confirm WebPay transaction
router.post('/confirm', validateConfirmPayment, validate, webpayController.confirmTransaction);

// GET/POST /api/webpay/return - WebPay return callback (handles both GET and POST)
router.get('/return', webpayController.handleReturn);
router.post('/return', webpayController.handleReturn);

// GET /api/webpay/transaction/:token - Get transaction status
router.get('/transaction/:token', webpayController.getTransactionStatus);

// GET /api/webpay/transactions - Get all transactions
router.get('/transactions', webpayController.getAllTransactions);

// GET /api/webpay/statistics - Get transaction statistics
router.get('/statistics', webpayController.getStatistics);

export default router;
