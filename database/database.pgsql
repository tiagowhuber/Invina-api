DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA IF NOT EXISTS public;
-- ==========================================
-- 1. ENUMS & EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Required for UUID generation

CREATE TYPE tour_type_enum AS ENUM ('Standard', 'Special');
CREATE TYPE order_status_enum AS ENUM ('Pending', 'Confirmed', 'Cancelled', 'Refunded');
CREATE TYPE payment_status_enum AS ENUM ('Pending', 'Completed', 'Failed', 'Refunded');

-- ==========================================
-- 2. CATALOG TABLES
-- ==========================================

-- Wines: Simple catalog of available wines
CREATE TABLE wines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    varietal VARCHAR(100),
    vintage INTEGER,
    image_url TEXT
);

-- Holidays: Dates where operations are suspended
CREATE TABLE feriados_irrenunciables (
    id SERIAL PRIMARY KEY,
    holiday_date DATE NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Tours: The definitions of the experiences you offer
CREATE TABLE tours (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    min_attendants INTEGER NOT NULL DEFAULT 1,
    max_attendants INTEGER NOT NULL, 
    base_price DECIMAL(10, 2) NOT NULL,
    tour_type tour_type_enum NOT NULL,
    earliest_hour TIME NOT NULL,
    latest_hour TIME NOT NULL,
    buffer_minutes INTEGER DEFAULT 60, -- Used by backend to calculate blocking
    is_active BOOLEAN DEFAULT TRUE
);

-- Tour Wines: Which wines are included in which tour (Menu)
CREATE TABLE tour_wines (
    tour_id INTEGER REFERENCES tours(id) ON DELETE CASCADE,
    wine_id INTEGER REFERENCES wines(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, wine_id)
);

-- Tour Images: Multiple images per tour
CREATE TABLE tour_images (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER REFERENCES tours(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Menus: Different pricing tiers/options for a tour
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER REFERENCES tours(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Menu Wines: Specific wines for a specific menu
CREATE TABLE menu_wines (
    menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
    wine_id INTEGER REFERENCES wines(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_id, wine_id)
);

-- ==========================================
-- 3. OPERATIONAL TABLES
-- ==========================================

-- Tour Instances: Specific scheduled occurrences
CREATE TABLE tour_instances (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER REFERENCES tours(id) NOT NULL,
    instance_date DATE NOT NULL,
    start_time TIME NOT NULL,
    
    -- Auto-updated by Trigger. Defines availability.
    current_attendants INTEGER DEFAULT 0 CHECK (current_attendants >= 0),
    
    UNIQUE (tour_id, instance_date, start_time)
);

-- Orders: The booking record
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number UUID DEFAULT uuid_generate_v4() UNIQUE,
    tour_instance_id INTEGER REFERENCES tour_instances(id),
    menu_id INTEGER REFERENCES menus(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    attendees_count INTEGER NOT NULL CHECK (attendees_count > 0),
    total_amount DECIMAL(10, 2) NOT NULL,
    status order_status_enum DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments: Transaction logs
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    provider VARCHAR(50) NOT NULL, -- e.g., 'Transbank', 'Stripe'
    transaction_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status payment_status_enum NOT NULL,
    response_payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Function to recalculate attendants count
CREATE OR REPLACE FUNCTION update_tour_capacity() RETURNS TRIGGER AS $$
BEGIN
    -- If an order is added or the count changes
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
        UPDATE tour_instances
        SET current_attendants = (
            SELECT COALESCE(SUM(attendees_count), 0)
            FROM orders
            WHERE tour_instance_id = NEW.tour_instance_id
            AND status IN ('Pending', 'Confirmed') -- Only count valid reservations
        )
        WHERE id = NEW.tour_instance_id;
    END IF;

    -- If an order is deleted
    IF (TG_OP = 'DELETE') THEN
        UPDATE tour_instances
        SET current_attendants = (
            SELECT COALESCE(SUM(attendees_count), 0)
            FROM orders
            WHERE tour_instance_id = OLD.tour_instance_id
            AND status IN ('Pending', 'Confirmed')
        )
        WHERE id = OLD.tour_instance_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the orders table
CREATE TRIGGER trg_update_capacity
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION update_tour_capacity();