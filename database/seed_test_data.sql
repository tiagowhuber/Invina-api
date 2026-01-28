-- ==========================================
-- SEED DATA FOR TESTING (Invina)
-- ==========================================

-- 1. Insert Wines
INSERT INTO wines (name, varietal, vintage) VALUES
('Cabernet Sauvignon Reserva', 'Cabernet Sauvignon', 2020),
('Carmenere Gran Reserva', 'Carmenere', 2019),
('Sauvignon Blanc Estate', 'Sauvignon Blanc', 2023),
('Syrah Private Collection', 'Syrah', 2018),
('Pinot Noir Selection', 'Pinot Noir', 2022);

-- 2. Insert Holidays (Feriados Irrenunciables)
-- Dates where NO tours are allowed.
INSERT INTO feriados_irrenunciables (holiday_date, description) VALUES
('2026-05-01', 'Labor Day'),
('2026-09-18', 'Independence Day'),
('2026-09-19', 'Army Day'),
('2026-12-25', 'Christmas');

-- 3. Insert Tours
-- A. Standard Tour (Classic Tasting)
-- Available Mon-Sat (enforced by code), multiple times a day.
INSERT INTO tours (
    name,
    description, 
    duration_minutes, 
    min_attendants, 
    max_attendants, 
    base_price, 
    tour_type, 
    earliest_hour, 
    latest_hour, 
    buffer_minutes, 
    is_active
) VALUES (
    'Classic Wine Tasting',
    'Experience our classic wine selection (Mon-Sat).', -- description
    60, -- duration (1 hour)
    1, -- min
    15, -- max
    25000.00, -- price (CLP)
    'Standard', 
    '10:00:00', -- earliest start
    '17:00:00', -- latest start
    30, -- buffer between tours
    TRUE
);

-- B. Special Tour (Premium Sunset)
-- Available Every Day, but locks the whole day once booked.
INSERT INTO tours (
    name,
    description, 
    duration_minutes, 
    min_attendants, 
    max_attendants, 
    base_price, 
    tour_type, 
    earliest_hour, 
    latest_hour, 
    buffer_minutes, 
    is_active
) VALUES (
    'Premium Sunset Experience',
    'Exclusive experiences available every day.', 
    120, -- duration (2 hours)
    2, -- min
    10, -- max
    55000.00, -- price
    'Special', 
    '10:00:00', -- Flexible start
    '18:00:00', 
    120, -- buffer
    TRUE
);

-- 4. Associate Wines to Tours
-- Tour 1 (Classic) gets wines 1, 2, 3
INSERT INTO tour_wines (tour_id, wine_id)
SELECT t.id, w.id 
FROM tours t, wines w 
WHERE t.name = 'Classic Wine Tasting' 
AND w.name IN ('Cabernet Sauvignon Reserva', 'Carmenere Gran Reserva', 'Sauvignon Blanc Estate');

-- Tour 2 (Premium) gets wines 2, 4, 5
INSERT INTO tour_wines (tour_id, wine_id)
SELECT t.id, w.id 
FROM tours t, wines w 
WHERE t.name = 'Premium Sunset Experience' 
AND w.name IN ('Carmenere Gran Reserva', 'Syrah Private Collection', 'Pinot Noir Selection');

-- 5. Add Menus for Premium Tour
-- Let's give the "Premium Sunset Experience" two menu options
WITH premium_tour AS (
    SELECT id FROM tours WHERE name = 'Premium Sunset Experience' LIMIT 1
)
INSERT INTO menus (tour_id, name, description, price, is_active)
VALUES
    ((SELECT id FROM premium_tour), 'Standard Selection', 'The classic premium experience.', 55000.00, TRUE),
    ((SELECT id FROM premium_tour), 'Exclusive Reserve', 'Top-tier wines from our private cellar.', 75000.00, TRUE);

-- 6. Associate Wines to Menus
-- Standard Menu: Wines 2, 4
INSERT INTO menu_wines (menu_id, wine_id)
SELECT m.id, w.id 
FROM menus m, wines w
WHERE m.name = 'Standard Selection' 
AND w.name IN ('Carmenere Gran Reserva', 'Syrah Private Collection');

-- Exclusive Menu: Wines 4, 5 and a standard one
INSERT INTO menu_wines (menu_id, wine_id)
SELECT m.id, w.id 
FROM menus m, wines w
WHERE m.name = 'Exclusive Reserve' 
AND w.name IN ('Syrah Private Collection', 'Pinot Noir Selection', 'Cabernet Sauvignon Reserva');

-- 7. (Optional) Seed a "Day Lock" scenario
-- Let's say someone booked the Special Tour on a specific future date.
-- This should prevent ANY other bookings on that day when testing.
-- Date: 2026-03-15 (Example)
/*
INSERT INTO tour_instances (tour_id, instance_date, start_time, current_attendants)
SELECT id, '2026-03-15', '14:00:00', 2
FROM tours 
WHERE tour_type = 'Special' LIMIT 1;

-- Associated Order for that instance
INSERT INTO orders (
    tour_instance_id, customer_name, customer_email, attendees_count, total_amount, status
)
VALUES (
    (SELECT id FROM tour_instances WHERE instance_date = '2026-03-15'),
    'Test User',
    'test@example.com',
    2,
    110000,
    'Confirmed'
);
*/

-- 8. Add Tour Images for Tour 1
INSERT INTO tour_images (tour_id, image_url, display_order)
VALUES
    (1, '/images/tours/TourEstandar1/Arearecepcióndeuvas1.jpg', 6),
    (1, '/images/tours/TourEstandar1/Bodegadefermentacionyguarda1.jpg', 7),
    (1, '/images/tours/TourEstandar1/Bodegadefermentacionyguarda2.jpg', 8),
    (1, '/images/tours/TourEstandar1/DegustaciondeVinos1.jpg', 11),
    (1, '/images/tours/TourEstandar1/DegustaciondeVinos2.jpg', 12),
    (1, '/images/tours/TourEstandar1/DegustaciondeVinos3.jpg', 13),
    (1, '/images/tours/TourEstandar1/JardinVariedades1.jpg', 1),
    (1, '/images/tours/TourEstandar1/JardinVariedades2.jpg', 2),
    (1, '/images/tours/TourEstandar1/LineadeEmbotellado1.jpg', 9),
    (1, '/images/tours/TourEstandar1/LineadeEmbotellado2.jpg', 10),
    (1, '/images/tours/TourEstandar1/MiradorElTrampolin1.jpg', 3),
    (1, '/images/tours/TourEstandar1/MiradorElTrampolin2.jpg', 4),
    (1, '/images/tours/TourEstandar1/MiradorElTrampolin3.jpg', 5);

