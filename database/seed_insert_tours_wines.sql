-- Seed sample tours, wines, and tour_wines (idempotent)
-- Run with: psql -d your_database -f seed_insert_tours_wines.sql

BEGIN;

-- Insert sample tours (no duplicates by name)
INSERT INTO tours (name, description, location, address, tour_type, base_price, min_tickets, max_capacity, duration_minutes, is_active)
SELECT 'Classic Vineyard Tour', 'A guided walk through the estate with three wine tastings and pairing notes.', 'Napa Valley', '123 Vineyard Lane, Napa, CA', 'option_1', 79.99, 2, 20, 120, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE name = 'Classic Vineyard Tour');

INSERT INTO tours (name, description, location, address, tour_type, base_price, min_tickets, max_capacity, duration_minutes, is_active)
SELECT 'Sunset Tasting', 'A relaxed evening tasting featuring sparkling and light reds while watching the sunset.', 'Sonoma', '45 Sunset Ridge, Sonoma, CA', 'option_2', 59.50, 2, 12, 90, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE name = 'Sunset Tasting');

INSERT INTO tours (name, description, location, address, tour_type, base_price, min_tickets, max_capacity, duration_minutes, is_active)
SELECT 'Reserve Cellar Experience', 'Exclusive access to reserve barrels, vertical tastings, and a behind-the-scenes cellar tour.', 'Paso Robles', '8 Cellar Rd, Paso Robles, CA', 'option_3', 129.00, 2, 10, 150, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE name = 'Reserve Cellar Experience');

INSERT INTO tours (name, description, location, address, tour_type, base_price, min_tickets, max_capacity, duration_minutes, is_active)
SELECT 'Blending Workshop', 'Hands-on blending session where guests create their own bottle from three varietals.', 'Napa Valley', '200 Blend Ave, Napa, CA', 'option_2', 99.00, 4, 16, 180, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE name = 'Blending Workshop');

-- Insert sample wines (no duplicates by name)
INSERT INTO wines (name, variety, vintage, description, is_active)
SELECT 'Estate Chardonnay', 'Chardonnay', 2018, 'Bright, citrus-driven chardonnay with subtle oak.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM wines WHERE name = 'Estate Chardonnay');

INSERT INTO wines (name, variety, vintage, description, is_active)
SELECT 'Reserve Pinot Noir', 'Pinot Noir', 2017, 'Silky red with red fruit and earthy notes.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM wines WHERE name = 'Reserve Pinot Noir');

INSERT INTO wines (name, variety, vintage, description, is_active)
SELECT 'Oak Aged Cabernet', 'Cabernet Sauvignon', 2016, 'Full-bodied cabernet aged in French oak.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM wines WHERE name = 'Oak Aged Cabernet');

INSERT INTO wines (name, variety, vintage, description, is_active)
SELECT 'Heritage Merlot', 'Merlot', 2019, 'Soft merlot with plum and chocolate notes.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM wines WHERE name = 'Heritage Merlot');

INSERT INTO wines (name, variety, vintage, description, is_active)
SELECT 'Sparkling Blanc', 'Sparkling', 2020, 'Crisp sparkling with green apple and brioche.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM wines WHERE name = 'Sparkling Blanc');

INSERT INTO wines (name, variety, vintage, description, is_active)
SELECT 'Late Harvest Riesling', 'Riesling', 2015, 'Luscious late-harvest with honeyed stone fruit.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM wines WHERE name = 'Late Harvest Riesling');

-- Link wines to tours (idempotent by checking existing tour_wines)
-- Classic Vineyard Tour: Estate Chardonnay (1), Reserve Pinot Noir (2), Oak Aged Cabernet (3)
INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 1 FROM tours t JOIN wines w ON w.name = 'Estate Chardonnay' WHERE t.name = 'Classic Vineyard Tour' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 2 FROM tours t JOIN wines w ON w.name = 'Reserve Pinot Noir' WHERE t.name = 'Classic Vineyard Tour' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 3 FROM tours t JOIN wines w ON w.name = 'Oak Aged Cabernet' WHERE t.name = 'Classic Vineyard Tour' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

-- Sunset Tasting: Sparkling Blanc (1), Reserve Pinot Noir (2), Heritage Merlot (3)
INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 1 FROM tours t JOIN wines w ON w.name = 'Sparkling Blanc' WHERE t.name = 'Sunset Tasting' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 2 FROM tours t JOIN wines w ON w.name = 'Reserve Pinot Noir' WHERE t.name = 'Sunset Tasting' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 3 FROM tours t JOIN wines w ON w.name = 'Heritage Merlot' WHERE t.name = 'Sunset Tasting' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

-- Reserve Cellar Experience: Oak Aged Cabernet (1), Late Harvest Riesling (2)
INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 1 FROM tours t JOIN wines w ON w.name = 'Oak Aged Cabernet' WHERE t.name = 'Reserve Cellar Experience' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 2 FROM tours t JOIN wines w ON w.name = 'Late Harvest Riesling' WHERE t.name = 'Reserve Cellar Experience' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

-- Blending Workshop: Reserve Pinot Noir (1), Heritage Merlot (2), Estate Chardonnay (3)
INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 1 FROM tours t JOIN wines w ON w.name = 'Reserve Pinot Noir' WHERE t.name = 'Blending Workshop' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 2 FROM tours t JOIN wines w ON w.name = 'Heritage Merlot' WHERE t.name = 'Blending Workshop' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

INSERT INTO tour_wines (tour_id, wine_id, display_order)
SELECT t.id, w.id, 3 FROM tours t JOIN wines w ON w.name = 'Estate Chardonnay' WHERE t.name = 'Blending Workshop' AND NOT EXISTS (SELECT 1 FROM tour_wines tw WHERE tw.tour_id = t.id AND tw.wine_id = w.id);

COMMIT;

-- Verification query examples:
-- SELECT t.name AS tour, w.name AS wine, tw.display_order
-- FROM tours t
-- JOIN tour_wines tw ON tw.tour_id = t.id
-- JOIN wines w ON w.id = tw.wine_id
-- ORDER BY t.name, tw.display_order;
