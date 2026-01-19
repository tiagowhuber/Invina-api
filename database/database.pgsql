-- Drop existing tables and types
DROP TABLE IF EXISTS webpay_transactions CASCADE;
DROP TABLE IF EXISTS order_wines CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS tour_instances CASCADE;
DROP TABLE IF EXISTS tour_wines CASCADE;
DROP TABLE IF EXISTS wines CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TYPE IF EXISTS tour_type CASCADE;

-- Tour types enum
CREATE TYPE tour_type AS ENUM ('option_1', 'option_2', 'option_3');

-- Tours table
CREATE TABLE tours (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    tour_type tour_type NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    min_tickets INTEGER NOT NULL DEFAULT 2,
    max_capacity INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wines table
CREATE TABLE wines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    variety VARCHAR(100),
    vintage INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tour wines junction table
CREATE TABLE tour_wines (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    wine_id INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    UNIQUE(tour_id, wine_id)
);

-- Tour instances (actual scheduled tours)
CREATE TABLE tour_instances (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    instance_date DATE NOT NULL,
    instance_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    tickets_sold INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    tour_instance_id INTEGER NOT NULL REFERENCES tour_instances(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    ticket_quantity INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ticket_quantity CHECK (ticket_quantity > 0)
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    attendee_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'reserved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order wines
CREATE TABLE order_wines (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    wine_id INTEGER NOT NULL REFERENCES wines(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, wine_id)
);

-- WebPay transactions table
CREATE TABLE webpay_transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    buy_order VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    response_code VARCHAR(10),
    authorization_code VARCHAR(50),
    transaction_date TIMESTAMP,
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tours_type ON tours(tour_type);
CREATE INDEX idx_tours_active ON tours(is_active);
CREATE INDEX idx_tour_instances_tour ON tour_instances(tour_id);
CREATE INDEX idx_tour_instances_datetime ON tour_instances(instance_date, instance_time);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_instance ON orders(tour_instance_id);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_webpay_order ON webpay_transactions(order_id);
CREATE INDEX idx_webpay_token ON webpay_transactions(token);