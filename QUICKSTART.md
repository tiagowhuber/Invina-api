# Quick Start Guide - New Backend

## 1. Database Setup

Run the new schema:
```bash
# Connect to PostgreSQL
psql -U postgres -d invina

# Run the schema file
\i database/database.pgsql

# Or from command line:
psql -U postgres -d invina < database/database.pgsql
```

## 2. Add Sample Data

```sql
-- Insert sample tours
INSERT INTO tours (name, description, location, address, tour_type, base_price, min_tickets, max_capacity, duration_minutes) VALUES
('Premium Wine Tasting', 'Select your favorite wines', 'Vineyard A', '123 Wine St', 'option_1', 75.00, 2, 12, 120),
('Standard Wine Tour', 'Pre-selected wine experience', 'Vineyard B', '456 Grape Ave', 'option_2', 50.00, 2, 20, 90),
('Daily Group Tour', 'Join our daily group experience', 'Vineyard C', '789 Vine Rd', 'option_3', 35.00, 1, 30, 60);

-- Insert sample wines
INSERT INTO wines (name, variety, vintage, description) VALUES
('Cabernet Reserve', 'Cabernet Sauvignon', 2020, 'Bold and elegant'),
('Chardonnay Classic', 'Chardonnay', 2021, 'Crisp and refreshing'),
('Merlot Premium', 'Merlot', 2019, 'Smooth and velvety'),
('Pinot Noir Estate', 'Pinot Noir', 2020, 'Light and aromatic'),
('Sauvignon Blanc', 'Sauvignon Blanc', 2022, 'Zesty and bright'),
('Syrah Reserve', 'Syrah', 2019, 'Spicy and full-bodied'),
('Rosé Garden', 'Rosé', 2022, 'Fresh and fruity');

-- Link wines to option_1 tour
INSERT INTO tour_wines (tour_id, wine_id, display_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5), (1, 6, 6), (1, 7, 7);
```

## 3. Start the Server

```bash
npm run dev
```

## 4. Test the Endpoints

### Get all tours
```bash
curl http://localhost:3000/api/tours
```

### Get wines for tour 1
```bash
curl http://localhost:3000/api/tours/1/wines
```

### Check availability
```bash
curl "http://localhost:3000/api/tours/1/availability?date=2026-02-15"
```

### Create Option 1 booking (with wine selection)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": 1,
    "instance_date": "2026-02-15",
    "instance_time": "14:00",
    "ticket_quantity": 4,
    "wine_ids": [1, 3, 5, 7],
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+1234567890"
  }'
```

### Create Option 2 booking (no wines)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": 2,
    "instance_date": "2026-02-15",
    "instance_time": "10:00",
    "ticket_quantity": 2,
    "customer_name": "Jane Smith",
    "customer_email": "jane@example.com"
  }'
```

### Create Option 3 booking (shared tour)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": 3,
    "instance_date": "2026-02-15",
    "instance_time": "10:00",
    "ticket_quantity": 2,
    "customer_name": "Bob Johnson",
    "customer_email": "bob@example.com"
  }'
```

### Get booking by order number
```bash
curl http://localhost:3000/api/bookings/ORD-20260215-ABC123
```

## 5. Verify Option 3 Behavior

Book two different customers on the same option_3 tour date:

**First booking:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": 3,
    "instance_date": "2026-02-20",
    "instance_time": "10:00",
    "ticket_quantity": 5,
    "customer_name": "Alice Cooper",
    "customer_email": "alice@example.com"
  }'
```

**Second booking (same date, should reuse instance):**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": 3,
    "instance_date": "2026-02-20",
    "instance_time": "14:00",
    "ticket_quantity": 3,
    "customer_name": "Charlie Brown",
    "customer_email": "charlie@example.com"
  }'
```

Then check the database:
```sql
SELECT * FROM tour_instances WHERE tour_id = 3 AND instance_date = '2026-02-20';
-- Should see only ONE instance with tickets_sold = 8 (5 + 3)
```

## 6. Environment Variables

Make sure your `.env` file contains:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=invina
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# WebPay (existing)
WEBPAY_COMMERCE_CODE=your_code
WEBPAY_API_KEY=your_key
WEBPAY_RETURN_URL=http://localhost:3000/api/webpay/return
```

## Common Issues

### TypeScript Errors
The circular dependency warnings in the models are expected and won't affect compilation. Just ignore:
```
Cannot find module './TourInstance'
Cannot find module './TourWine'
```

### Database Connection
If you get connection errors, verify:
1. PostgreSQL is running
2. Database `invina` exists
3. Credentials in `.env` are correct

### Booking Validation Errors
- **"Minimum X tickets required"**: Increase `ticket_quantity`
- **"Wine selection is required"**: Add `wine_ids` array for option_1 tours
- **"Wine selection is not allowed"**: Remove `wine_ids` for option_2/option_3 tours
- **"Invalid wine selections"**: Use only wine IDs from `tour_wines` table
- **"Not enough capacity"**: Reduce `ticket_quantity` or choose different time

## Next Steps

1. Update WebPay controller to work with new Order model (if needed)
2. Test payment flow end-to-end
3. Update frontend to use new API endpoints
4. Add admin endpoints for tour/wine management
5. Implement order expiration cron job
