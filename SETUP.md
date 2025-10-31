# Quick Start Guide

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ npm or yarn package manager

## Step-by-Step Setup

### 1. Database Setup

Create the database and run the schema:

```powershell
# Create database
createdb invina

# Or using psql
psql -U postgres -c "CREATE DATABASE invina;"

# Run the schema
psql -d invina -f database/database.pgsql

# Or if you need to specify user
psql -U postgres -d invina -f database/database.pgsql
```

### 2. Environment Configuration

Copy and configure the environment file:

```powershell
# Copy the example file
Copy-Item .env.example .env

# Edit .env with your settings
notepad .env
```

**Required configurations in `.env`:**

```env
# Database (update with your credentials)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=invina
DB_USER=postgres
DB_PASSWORD=your_actual_password

# WebPay (for testing, use integration credentials)
WEBPAY_ENVIRONMENT=integration

# Server
PORT=3000
```

### 3. Install Dependencies (Already Done)

Dependencies should already be installed, but if needed:

```powershell
npm install
```

### 4. Build the Project

Compile TypeScript to JavaScript:

```powershell
npm run build
```

### 5. Run the Server

**Development mode** (with hot-reload):
```powershell
npm run dev
```

**Production mode**:
```powershell
npm start
```

### 6. Verify Installation

Open your browser or use curl:

```powershell
# Check health
curl http://localhost:3000/health

# Check API info
curl http://localhost:3000
```

Expected response:
```json
{
  "success": true,
  "message": "Welcome to Invina Event Ticketing API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

## Testing the API

### 1. Create an Event

```powershell
curl -X POST http://localhost:3000/api/events `
  -H "Content-Type: application/json" `
  -d '{
    \"name\": \"Test Event\",
    \"description\": \"A test event\",
    \"event_date\": \"2025-12-31T20:00:00\",
    \"location\": \"Test Venue\",
    \"capacity\": 100,
    \"price\": 25.00
  }'
```

### 2. View Events

```powershell
curl http://localhost:3000/api/events/availability
```

### 3. Create an Order

```powershell
curl -X POST http://localhost:3000/api/orders `
  -H "Content-Type: application/json" `
  -d '{
    \"customer_name\": \"Test Customer\",
    \"customer_email\": \"test@example.com\",
    \"tickets\": [
      { \"event_id\": 1 }
    ]
  }'
```

### 4. Initiate Payment

```powershell
curl -X POST http://localhost:3000/api/webpay/initiate `
  -H "Content-Type: application/json" `
  -d '{ \"order_id\": 1 }'
```

## Common Issues

### Database Connection Failed

- Check PostgreSQL is running: `Get-Service postgresql*`
- Verify credentials in `.env`
- Check database exists: `psql -l`

### Port Already in Use

Change the port in `.env`:
```env
PORT=3001
```

### TypeScript Errors

Make sure all dependencies are installed:
```powershell
npm install
```

### WebPay Errors

For testing, ensure you're using integration mode:
```env
WEBPAY_ENVIRONMENT=integration
```

## Next Steps

1. **Frontend Integration**: Use the API with your frontend application
2. **Production Setup**: Get Transbank production credentials
3. **Email Notifications**: Add email service for ticket confirmations
4. **QR Codes**: Generate QR codes for tickets
5. **Admin Panel**: Build an admin interface for event management

## Useful Commands

```powershell
# Development with watch mode
npm run dev:watch

# Build for production
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# View logs (if using PM2 in production)
pm2 logs invina
```

## API Documentation

- Full API documentation: See `API_EXAMPLES.md`
- Database schema: See `database/database.pgsql`
- Project overview: See `README.md`

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify database connection
3. Review the API examples
4. Check environment variables

Happy coding! 🚀
