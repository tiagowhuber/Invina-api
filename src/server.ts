import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

// Import routes
import eventsRoutes from './routes/events';
import ordersRoutes from './routes/orders';
import ticketsRoutes from './routes/tickets';
import webpayRoutes from './routes/webpay';
import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import configs
import { testConnection } from './config/database';
import './config/webpay';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Invina API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/events', eventsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/webpay', webpayRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Invina Event Ticketing API',
    version: '1.0.0',
    endpoints: {
      events: '/api/events',
      orders: '/api/orders',
      tickets: '/api/tickets',
      webpay: '/api/webpay',
      admin: '/api/admin',
      health: '/health',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server with database connection
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Invina API Server`);
      console.log(`=================================`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('=================================');
      console.log('ℹ️  Order expiration: Call POST /api/admin/expire-orders manually');
      console.log('   or set up external cron (Vercel Cron, GitHub Actions, etc.)');
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
