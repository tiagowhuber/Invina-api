import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { testConnection } from './config/database';

import tourRoutes from './routes/tourRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/tours', tourRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', paymentRoutes); // For expire-orders

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start Server
const start = async () => {
    // Only connect logic if not imported (e.g. for tests)
    if (require.main === module) {
        await testConnection();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
};

start();

export default app;
