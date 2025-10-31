import express from 'express';
import { ordersController } from '../controllers/ordersController';
import { validateCreateOrder, validateId, validate } from '../middleware/validators';

const router = express.Router();

// GET /api/orders - Get all orders
router.get('/', ordersController.getAllOrders);

// GET /api/orders/:id - Get order by ID
router.get('/:id', validateId, validate, ordersController.getOrderById);

// GET /api/orders/number/:orderNumber - Get order by order number
router.get('/number/:orderNumber', ordersController.getOrderByNumber);

// GET /api/orders/customer/:email - Get orders by customer email
router.get('/customer/:email', ordersController.getOrdersByEmail);

// POST /api/orders - Create new order
router.post('/', validateCreateOrder, validate, ordersController.createOrder);

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', validateId, validate, ordersController.cancelOrder);

export default router;
