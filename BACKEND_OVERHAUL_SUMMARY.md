# Backend Overhaul Implementation - Complete

## Overview
Complete backend rebuild for Invina tour booking system with wine selection, tour instances, and tour-type-specific logic.

## Database Schema
Using the new schema defined in `database/database.pgsql`:
- `tours` - Tour definitions with type (option_1, option_2, option_3)
- `wines` - Wine catalog
- `tour_wines` - Junction table for tour-wine associations
- `tour_instances` - Scheduled tour instances (date/time/capacity)
- `orders` - Customer bookings
- `tickets` - Individual tickets per booking
- `order_wines` - Wine selections for option_1 tours
- `webpay_transactions` - Payment processing (existing)

## Implementation Details

### 1. Type Definitions (`src/types/index.ts`)
✅ **Complete**

New types added:
- `TourType`: 'option_1' | 'option_2' | 'option_3'
- `TourInstanceStatus`: 'active' | 'completed' | 'cancelled'
- `Tour`, `Wine`, `TourWine`, `TourInstance`, `Order`, `Ticket`, `OrderWine`
- `CreateBookingRequest` with validation schema
- Extended types: `TourWithWines`, `TourInstanceWithTour`, `TourInstanceAvailability`, `OrderWithDetails`

### 2. Sequelize Models
✅ **Complete**

**New Models:**
- `Tour.ts` - Tour definitions with tour_type enum, pricing, capacity rules
- `Wine.ts` - Wine catalog with variety, vintage, description
- `TourWine.ts` - Many-to-many junction with display_order
- `TourInstance.ts` - Scheduled instances with:
  - Unique constraint: `(tour_id, instance_date)` where `status='active'` for option_3
  - Capacity tracking with `tickets_sold` counter
- `OrderWine.ts` - Many-to-many junction for option_1 wine selections

**Updated Models:**
- `Order.ts` - Now references `tour_instance_id` instead of multiple events
- `Ticket.ts` - Removed `event_id`, simplified to order-only association

**Associations:**
- Tour ←→ TourInstance (one-to-many)
- Tour ←→ Wine (many-to-many through TourWine)
- TourInstance ←→ Order (one-to-many)
- Order ←→ Ticket (one-to-many)
- Order ←→ Wine (many-to-many through OrderWine)

### 3. Controllers

#### **toursController.ts** ✅ **Complete**

**Endpoints:**
1. `GET /api/tours` - List all active tours
2. `GET /api/tours/:id` - Get single tour details
3. `GET /api/tours/:id/wines` - Get available wines for tour (option_1 only)
4. `GET /api/tours/:id/availability?date=YYYY-MM-DD` - Check available times and capacity

**Features:**
- Active tour filtering (`is_active=true`)
- Wine list ordered by `display_order`
- Availability calculation: `tickets_available = capacity - tickets_sold`

#### **bookingsController.ts** ✅ **Complete**

**Endpoints:**
1. `POST /api/bookings` - Create booking with full validation
2. `GET /api/bookings/:orderNumber` - Lookup booking by order number

**Create Booking Logic (Step-by-Step):**

1. **Validate tour exists and is active**
   ```typescript
   const tour = await Tour.findOne({ where: { id: tour_id, is_active: true } });
   ```

2. **Validate minimum ticket quantity**
   ```typescript
   if (ticket_quantity < tour.min_tickets) throw error;
   ```

3. **Tour-Type-Specific Wine Validation**
   - **Option 1**: Wine IDs required, validate against `tour_wines` table
   - **Option 2/3**: Wine IDs forbidden

4. **Tour Instance Creation/Reuse**
   - **Option 1 & 2**: Always create new `TourInstance`
   - **Option 3**: Use `findOrCreate` to reuse existing instance for same date
     ```typescript
     const [instance] = await TourInstance.findOrCreate({
       where: { tour_id, instance_date, status: 'active' },
       defaults: { /* instance data */ }
     });
     ```

5. **Capacity Check with Row-Level Locking**
   ```typescript
   const lockedInstance = await TourInstance.findOne({
     where: { id: tourInstance.id },
     lock: true,  // Row-level lock within transaction
     transaction
   });
   if (lockedInstance.tickets_sold + ticket_quantity > capacity) throw error;
   ```

6. **Create Order**
   - Generate unique `order_number`
   - Calculate `total_amount = base_price × ticket_quantity`
   - Status: 'pending'

7. **Create Tickets**
   - Generate unique `ticket_number` for each ticket
   - Initial status: 'reserved'

8. **Create OrderWines (Option 1 only)**
   ```typescript
   if (tour.tour_type === 'option_1') {
     for (const wine_id of wine_ids) {
       await OrderWine.create({ order_id, wine_id });
     }
   }
   ```

9. **Increment Tickets Sold**
   ```typescript
   await lockedInstance.increment('tickets_sold', { by: ticket_quantity });
   ```

10. **Commit Transaction**
    - All operations wrapped in Sequelize transaction
    - Rollback on any error

**Transaction Safety:**
- Uses Sequelize transactions with `lock: true` for row-level locking
- Prevents race conditions on capacity checks
- Atomic creation of order + tickets + wine selections
- Proper rollback on validation failures

**Error Handling:**
- Unique constraint violations (duplicate bookings)
- Capacity exceeded
- Invalid wine selections
- Missing tour/inactive tour

### 4. Validation Middleware (`src/middleware/validators.ts`)
✅ **Complete**

**validateBookingRequest:**
- `tour_id` - required integer
- `instance_date` - required YYYY-MM-DD format
- `instance_time` - required HH:MM 24-hour format
- `ticket_quantity` - required positive integer
- `wine_ids` - optional array of integers
- `customer_name` - required, max 255 chars
- `customer_email` - required, valid email, normalized
- `customer_phone` - optional, max 50 chars

**validateAvailabilityQuery:**
- `id` param validation for tour ID

### 5. Routes
✅ **Complete**

**tours.ts:**
```
GET    /api/tours                      - List all tours
GET    /api/tours/:id                  - Get tour details
GET    /api/tours/:id/wines            - Get tour wines
GET    /api/tours/:id/availability     - Check availability
```

**bookings.ts:**
```
POST   /api/bookings                   - Create booking
GET    /api/bookings/:orderNumber      - Get booking details
```

### 6. Database Configuration (`src/config/database.ts`)
✅ **Complete**

Updated `testConnection()` to register new models:
- Tour, Wine, TourWine, TourInstance, Order, Ticket, OrderWine
- Removed old EventEntity references
- Kept WebPayTransactionEntity for payment processing

### 7. Server Configuration (`src/server.ts`)
✅ **Complete**

**Changes:**
- Replaced old routes (events, orders, tickets) with new routes (tours, bookings)
- Updated API welcome message to "Tour Booking API v2.0.0"
- New endpoint listing in root response

**Active Routes:**
- `/api/tours` → toursRoutes
- `/api/bookings` → bookingsRoutes
- `/api/webpay` → webpayRoutes (existing, unchanged)
- `/api/admin` → adminRoutes (existing, unchanged)

## Key Features Implemented

### ✅ Option 1 Tours (Wine Selection Required)
- Validates wine_ids array is provided
- Checks all wines exist in `tour_wines` for that tour
- Creates `order_wines` records for selected wines
- Always creates new tour_instance (private tours)

### ✅ Option 2 Tours (No Wine Selection)
- Rejects any wine_ids in request
- Always creates new tour_instance (private tours)
- No order_wines records

### ✅ Option 3 Tours (Shared Daily Tours)
- Rejects any wine_ids in request
- **Critical**: Uses `findOrCreate` to reuse existing tour_instance for same date
- Unique constraint prevents multiple active instances per day per tour
- Multiple customers can book into same tour_instance
- Capacity managed across all orders for that instance

### ✅ Capacity Management
- Row-level locking with `lock: true` in transaction
- Atomic check: `tickets_sold + new_quantity <= capacity`
- Automatic increment on successful booking
- Prevents double-booking race conditions

### ✅ Transaction Safety
- All booking operations in single Sequelize transaction
- Rollback on any validation or database error
- Guaranteed data consistency

## Migration Notes

### Old Models (To Be Removed Later)
These files can be deleted after confirming new system works:
- `src/models/Event.ts`
- `src/controllers/eventsController.ts`
- `src/controllers/ordersController.ts`
- `src/controllers/ticketsController.ts`
- `src/routes/events.ts`
- `src/routes/orders.ts`
- `src/routes/tickets.ts`

### Data Migration Required
If you have existing data in old schema, you'll need to:
1. Export existing orders/tickets
2. Run new database schema (database.pgsql)
3. Migrate data to new structure or start fresh

### Environment Variables
Same as before:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `CORS_ORIGIN`
- `NODE_ENV`

## Testing Checklist

### Option 1 Tours
- [ ] Cannot book without wine_ids
- [ ] Invalid wine_ids rejected
- [ ] Creates order_wines records
- [ ] Each booking creates new tour_instance

### Option 2 Tours
- [ ] Cannot book with wine_ids
- [ ] Each booking creates new tour_instance
- [ ] No order_wines created

### Option 3 Tours
- [ ] Cannot book with wine_ids
- [ ] First booking creates tour_instance
- [ ] Second booking same day reuses instance
- [ ] tickets_sold increments correctly
- [ ] Capacity limit enforced across multiple bookings

### General
- [ ] Minimum ticket validation works
- [ ] Capacity exceeded returns error
- [ ] Order number generation unique
- [ ] Ticket numbers unique
- [ ] Transaction rollback on errors
- [ ] Availability endpoint shows correct data

## API Examples

### Create Option 1 Booking (with wines)
```json
POST /api/bookings
{
  "tour_id": 1,
  "instance_date": "2026-02-15",
  "instance_time": "14:00",
  "ticket_quantity": 4,
  "wine_ids": [1, 3, 5, 7],
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890"
}
```

### Create Option 3 Booking (shared tour)
```json
POST /api/bookings
{
  "tour_id": 3,
  "instance_date": "2026-02-15",
  "instance_time": "10:00",
  "ticket_quantity": 2,
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com"
}
```

### Check Availability
```
GET /api/tours/1/availability?date=2026-02-15
```

Response:
```json
{
  "success": true,
  "data": {
    "tour_id": 1,
    "tour_name": "Premium Wine Tasting",
    "tour_type": "option_1",
    "date": "2026-02-15",
    "min_tickets": 2,
    "max_capacity": 12,
    "base_price": 75.00,
    "availability": [
      {
        "instance_time": "10:00",
        "capacity": 12,
        "tickets_sold": 4,
        "tickets_available": 8,
        "instance_id": 15
      },
      {
        "instance_time": "14:00",
        "capacity": 12,
        "tickets_sold": 0,
        "tickets_available": 12,
        "instance_id": 16
      }
    ]
  }
}
```

## Next Steps

1. **Run Database Schema**
   ```bash
   psql -U postgres -d invina < database/database.pgsql
   ```

2. **Install Dependencies** (if needed)
   ```bash
   npm install
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

4. **Test Endpoints**
   - Create sample tours in database
   - Create sample wines
   - Link wines to tours in tour_wines
   - Test all three tour types

5. **Update WebPay Controller** (if needed)
   - Ensure it works with new Order model
   - Update any references to old schema

6. **Frontend Updates** (separate task)
   - Update API calls to new endpoints
   - Add wine selection UI for option_1
   - Update booking flow

## Files Created/Modified

### Created:
- `src/models/Tour.ts`
- `src/models/Wine.ts`
- `src/models/TourWine.ts`
- `src/models/TourInstance.ts`
- `src/models/OrderWine.ts`
- `src/controllers/toursController.ts`
- `src/controllers/bookingsController.ts`
- `src/routes/tours.ts`
- `src/routes/bookings.ts`

### Modified:
- `src/types/index.ts` - Complete replacement with new types
- `src/models/Order.ts` - Complete replacement
- `src/models/Ticket.ts` - Complete replacement
- `src/middleware/validators.ts` - Added new validators
- `src/config/database.ts` - Updated model registration
- `src/server.ts` - Updated routes and API info

### Ready for Deletion (Old Schema):
- `src/models/Event.ts`
- `src/controllers/eventsController.ts`
- `src/controllers/ordersController.ts`
- `src/controllers/ticketsController.ts`
- `src/routes/events.ts`
- `src/routes/orders.ts`
- `src/routes/tickets.ts`

---

**Implementation Status: ✅ COMPLETE**

All requirements have been implemented with:
- Proper transaction handling
- Row-level locking for capacity checks
- findOrCreate for option_3 instance reuse
- Comprehensive validation
- Full type safety
- Error handling
