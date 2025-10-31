-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (one order can have multiple tickets)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'paid', 'cancelled', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table (links orders to events)
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    event_id INTEGER NOT NULL REFERENCES events(id),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    attendee_name VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'reserved', 'confirmed', 'used', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WebPay transactions table
CREATE TABLE webpay_transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    token VARCHAR(255) UNIQUE NOT NULL, -- WebPay token
    buy_order VARCHAR(255), -- WebPay buy order
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'rejected', 'failed'
    response_code VARCHAR(10), -- WebPay response code
    authorization_code VARCHAR(50), -- WebPay authorization code
    transaction_date TIMESTAMP,
    raw_response JSONB, -- Store full WebPay response for debugging
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_webpay_order ON webpay_transactions(order_id);
CREATE INDEX idx_webpay_token ON webpay_transactions(token);

-- View for available capacity per event
CREATE VIEW event_availability AS
SELECT 
    e.id,
    e.name,
    e.event_date,
    e.capacity,
    COUNT(t.id) FILTER (WHERE t.status IN ('reserved', 'confirmed')) as tickets_sold,
    e.capacity - COUNT(t.id) FILTER (WHERE t.status IN ('reserved', 'confirmed')) as tickets_available
FROM events e
LEFT JOIN tickets t ON e.id = t.event_id
WHERE e.is_active = true
GROUP BY e.id;

-- Function to update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webpay_transactions_updated_at BEFORE UPDATE ON webpay_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();