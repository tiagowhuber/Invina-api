# Invina - Event Ticketing System API

A complete event ticketing system backend built with Node.js, TypeScript, Express, PostgreSQL, and WebPay Plus integration for payment processing.

## Features

- ✅ **Event Management**: Create, update, and manage events
- ✅ **Order Processing**: Handle ticket orders with capacity validation
- ✅ **WebPay Plus Integration**: Secure payment processing via Transbank
- ✅ **Ticket Management**: Generate unique tickets with QR codes support
- ✅ **Auto-expiration Check**: Orders are checked for expiration before payment
- ✅ **Serverless Compatible**: Works on Vercel, AWS Lambda, and other serverless platforms
- ✅ **Real-time Availability**: Track event capacity and ticket availability
- ✅ **Full TypeScript**: Type-safe codebase with proper interfaces
- ✅ **Input Validation**: Request validation using express-validator
- ✅ **Error Handling**: Comprehensive error handling middleware
- ✅ **Security**: Helmet, CORS, and best practices implemented

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5
- **Database**: PostgreSQL
- **Payment Gateway**: Transbank WebPay Plus SDK
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Deployment**: Serverless-ready (Vercel, AWS Lambda, etc.)

## Project Structure

```
invina/
├── src/
│   ├── config/          # Configuration files (database, webpay)
│   ├── controllers/     # Request handlers with business logic
│   ├── middleware/      # Validation and error handling
│   ├── models/          # Database models (CRUD operations)
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and cron jobs
│   └── server.ts        # Main application entry point
├── database/
│   └── database.pgsql   # Database schema with tables, indexes, triggers
├── dist/                # Compiled JavaScript (after build)
├── .env.example         # Environment variables template
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies and scripts
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Transbank WebPay Plus account (for production)

## Installation

1. **Clone and install dependencies**:
   ```powershell
   npm install
   ```

2. **Set up PostgreSQL database**:
   ```powershell
   # Create database
   createdb invina

   # Run the schema
   psql -d invina -f database/database.pgsql
   ```

3. **Configure environment variables**:
   ```powershell
   # Copy example env file
   cp .env.example .env

   # Edit .env with your credentials
   ```

4. **Update `.env` file** with your configuration:
   - Database credentials
   - WebPay credentials (use integration for testing)
   - Order expiration settings

## Environment Variables

See `.env.example` for all available configuration options:

- **Database**: Connection settings for PostgreSQL
- **WebPay**: Commerce code, API key, environment (integration/production)
- **Orders**: Expiration time and cleanup interval
- **Server**: Port and CORS settings

## Usage

### Development Mode

Run with hot-reloading:
```powershell
npm run dev
```

### Production Mode

1. Build TypeScript:
   ```powershell
   npm run build
   ```

2. Start server:
   ```powershell
   npm start
   ```

## API Endpoints

### Events

- `GET /api/events` - Get all active events
- `GET /api/events/availability` - Get events with availability info
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/:id/availability` - Get event with availability
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Deactivate event

### Orders

- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order with details
- `GET /api/orders/number/:orderNumber` - Get order by order number
- `GET /api/orders/customer/:email` - Get orders by customer email
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/cancel` - Cancel order

### Tickets

- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `GET /api/tickets/number/:ticketNumber` - Get ticket details
- `GET /api/tickets/order/:orderId` - Get tickets by order
- `GET /api/tickets/event/:eventId` - Get tickets by event
- `GET /api/tickets/event/:eventId/statistics` - Get event statistics
- `PUT /api/tickets/:id/use` - Mark ticket as used
- `PUT /api/tickets/number/:ticketNumber/use` - Mark ticket as used
- `PUT /api/tickets/:id/attendee` - Update attendee name

### WebPay (Payment)

- `POST /api/webpay/initiate` - Initiate payment transaction
- `POST /api/webpay/confirm` - Confirm transaction
- `GET/POST /api/webpay/return` - WebPay return callback
- `GET /api/webpay/transaction/:token` - Get transaction status
- `GET /api/webpay/transactions` - Get all transactions
- `GET /api/webpay/statistics` - Get transaction statistics

### Admin

- `POST /api/admin/expire-orders` - Manually expire old pending orders
- `GET /api/admin/health` - Admin API health check

### Health Check

- `GET /health` - API health status
- `GET /` - API information and endpoints list

## WebPay Plus Integration Flow

1. **Create Order**: Customer creates an order with tickets
2. **Initiate Payment**: Frontend calls `/api/webpay/initiate` with order_id (auto-checks expiration)
3. **Redirect to WebPay**: User is redirected to WebPay payment page
4. **Payment Processing**: User completes payment on WebPay
5. **Return to App**: WebPay redirects back to `/api/webpay/return`
6. **Confirm Order**: If approved, order status changes to "paid" and tickets to "confirmed"

## Database Schema

The system uses 4 main tables:

- **events**: Event details with capacity and pricing
- **orders**: Customer orders with status tracking
- **tickets**: Individual tickets linked to orders and events
- **webpay_transactions**: Payment transaction records

Plus views, triggers, and indexes for performance.

## Order Expiration (Serverless Compatible)

Orders are automatically checked for expiration:
- **Before Payment**: When initiating payment, the system checks if the order has expired
- **Manual Trigger**: Call `POST /api/admin/expire-orders` to manually expire old orders
- **External Cron**: Set up Vercel Cron, GitHub Actions, or similar to periodically call the admin endpoint

### Setting up Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/admin/expire-orders",
    "schedule": "*/5 * * * *"
  }]
}
```

This will automatically call the expiration endpoint every 5 minutes.

## Security Features

- Helmet for HTTP headers security
- CORS configuration
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- Error sanitization (no sensitive data in production)

## Error Handling

Comprehensive error handling for:
- Database errors (unique violations, foreign keys, etc.)
- Validation errors
- WebPay/Transbank errors
- 404 routes
- Unexpected errors

## Development

### TypeScript

The entire codebase is written in TypeScript with strict type checking. Types are defined in `src/types/index.ts`.

### Code Structure

- **Models**: Database access layer (CRUD operations)
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions
- **Middleware**: Reusable validation and error handling
- **Utils**: Helper functions and scheduled tasks

## Testing

To test WebPay integration:

1. Use integration environment (default in `.env.example`)
2. Use test cards from Transbank documentation
3. Monitor transaction status via API endpoints

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Configure production WebPay credentials
3. Set up proper CORS origins
4. Use process manager (PM2) or similar
5. Set up SSL/TLS certificate
6. Configure database connection pooling
7. Set up logging and monitoring

## License

ISC

## Support

For issues or questions, please check the API documentation at `GET /` endpoint.
