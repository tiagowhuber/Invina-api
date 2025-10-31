# API Testing Examples

## Create Event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Concert 2025",
    "description": "Amazing summer concert event",
    "event_date": "2025-07-15T20:00:00",
    "location": "Central Park",
    "address": "123 Park Ave, City",
    "capacity": 500,
    "price": 50.00
  }'
```

## Get Events with Availability

```bash
curl http://localhost:3000/api/events/availability
```

## Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+1234567890",
    "tickets": [
      {
        "event_id": 1,
        "attendee_name": "John Doe"
      },
      {
        "event_id": 1,
        "attendee_name": "Jane Doe"
      }
    ]
  }'
```

## Initiate WebPay Payment

```bash
curl -X POST http://localhost:3000/api/webpay/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1
  }'
```

## Get Order Details

```bash
curl http://localhost:3000/api/orders/1
```

## Get Ticket by Number

```bash
curl http://localhost:3000/api/tickets/number/TKT-20251031-ABC123
```

## Mark Ticket as Used

```bash
curl -X PUT http://localhost:3000/api/tickets/number/TKT-20251031-ABC123/use
```

## Get Transaction Statistics

```bash
curl http://localhost:3000/api/webpay/statistics
```

## Health Check

```bash
curl http://localhost:3000/health
```

## Admin: Expire Old Orders

```bash
curl -X POST http://localhost:3000/api/admin/expire-orders
```

Response:
```json
{
  "success": true,
  "message": "Order expiration completed",
  "data": {
    "expired": 3,
    "errors": 0
  }
}
```
