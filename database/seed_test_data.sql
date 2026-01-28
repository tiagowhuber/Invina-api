-- ==========================================
-- INSERT DATA SCRIPT FOR INVINA TOURS
-- ==========================================

-- ==========================================
-- 1. INSERT WINES
-- ==========================================
INSERT INTO wines (name, varietal, vintage, image_url) VALUES
('Cabernet Franc', NULL, NULL, NULL),
('Cabernet Sauvignon', NULL, NULL, NULL),
('Carignan', NULL, NULL, NULL),
('Carmenere', NULL, NULL, NULL),
('Chardonnay', NULL, NULL, NULL),
('Garnacha', NULL, NULL, NULL),
('Malbec', NULL, NULL, NULL),
('Merlot', NULL, NULL, NULL),
('Mourvedre', NULL, NULL, NULL),
('Pais', NULL, NULL, NULL),
('Petit Verdot', NULL, NULL, NULL),
('Pinot Grigio', NULL, NULL, NULL),
('Pinot Noir', NULL, NULL, NULL),
('Red Blend', NULL, NULL, NULL),
('Sauvignon Blanc', NULL, NULL, NULL),
('Syrah', NULL, NULL, NULL),
('Tempranillo', NULL, NULL, NULL),
('Tinto', NULL, NULL, NULL),
('Tintorero', NULL, NULL, NULL),
('Viognier', NULL, NULL, NULL),
('Sauvignon Blanc - Carmenere', NULL, NULL, NULL),
('Chardonnay - Viognier', NULL, NULL, NULL),
('Malbec - Syrah', NULL, NULL, NULL),
('Pinot Noir - Syrah', NULL, NULL, NULL),
('Cabernet Franc - Carmenere', NULL, NULL, NULL),
('Cabernet Sauvignon - Syrah', NULL, NULL, NULL),
('Tempranillo - Merlot', NULL, NULL, NULL);

-- ==========================================
-- 2. INSERT FERIADOS IRRENUNCIABLES (Chile 2026-2027)
-- ==========================================
-- 2026
INSERT INTO feriados_irrenunciables (holiday_date, description) VALUES
('2026-01-01', 'Año Nuevo'),
('2026-04-03', 'Viernes Santo'),
('2026-04-04', 'Sábado Santo'),
('2026-05-01', 'Día del Trabajo'),
('2026-05-21', 'Día de las Glorias Navales'),
('2026-06-29', 'San Pedro y San Pablo'),
('2026-07-16', 'Día de la Virgen del Carmen'),
('2026-08-15', 'Asunción de la Virgen'),
('2026-09-18', 'Independencia Nacional'),
('2026-09-19', 'Día de las Glorias del Ejército'),
('2026-10-12', 'Encuentro de Dos Mundos'),
('2026-10-31', 'Día de las Iglesias Evangélicas y Protestantes'),
('2026-11-01', 'Día de Todos los Santos'),
('2026-12-08', 'Inmaculada Concepción'),
('2026-12-25', 'Navidad'),
-- 2027
('2027-01-01', 'Año Nuevo'),
('2027-03-26', 'Viernes Santo'),
('2027-03-27', 'Sábado Santo'),
('2027-05-01', 'Día del Trabajo'),
('2027-05-21', 'Día de las Glorias Navales'),
('2027-06-28', 'San Pedro y San Pablo'),
('2027-07-16', 'Día de la Virgen del Carmen'),
('2027-08-15', 'Asunción de la Virgen'),
('2027-09-18', 'Independencia Nacional'),
('2027-09-19', 'Día de las Glorias del Ejército'),
('2027-10-11', 'Encuentro de Dos Mundos'),
('2027-10-31', 'Día de las Iglesias Evangélicas y Protestantes'),
('2027-11-01', 'Día de Todos los Santos'),
('2027-12-08', 'Inmaculada Concepción'),
('2027-12-25', 'Navidad');

-- ==========================================
-- 3. INSERT TOURS
-- ==========================================
INSERT INTO tours (name, description, duration_minutes, min_attendants, max_attendants, base_price, tour_type, earliest_hour, latest_hour, buffer_minutes, is_active) VALUES
('Tour Bodega InVina', 
'Se inicia en la sala de ventas con un Video de introducción
Visita a Jardín de Variedades con paseo explicativo por distintas cepas e estructuras de formación. Aprenda las diferencias entre distintas variedades: su hoja, su racimo, su forma de crecer, la poda y formación, y los vinos que cada cepa produce. Aprenda las diferentes formas de conducir la parra.
Mirador "El Trampolin": Suba al mirador con espectaculares vistas al viñedo Buena Vista
Visita el área de recepción y molienda, y aprenda las distintas etapas de recibir y moler las uvas. Aprenda la diferentes formas en que tintos y blancos son recibidos.
Visita a la bodega de fermentación: Aprenda como se utiliza simples maneras de manejar el proceso natural de la fermentación de uva a vino. Cómo controlar la fermentación para obtener los mejores resultados. Deguste dos vinos directamente de la cuba, aprenda la diferencia entre vinos en bruto vs. Vinos terminados.
Visita a la sala de embotellado: Conozca el proceso de embotellado, desde el lavado de las botellas, el llenado y tapado, encapsulado, etiquetado y encajado.',
120, 2, 20, 15000, 'Standard', '10:00:00', '18:00:00', 60, TRUE),

('E-Bicicleta',
'Disfrute el paisaje y sienta el aire fresco del campo con tour por los viñedos en una bicicleta eléctrica. Relájate en un precioso y circuito por los viñedos con tranquilidad y relajo.',
120, 1, 3, 15000, 'Standard', '10:00:00', '18:00:00', 0, TRUE),

('Maravilla Maridaje',
'Recorrido completo idéntico a los tours standard: Jardín de variedades, Mirador El Trampolin, Area de recepción, bodega de vinos, área de embotellado. En seguida se realizará un almuerzo o cena en la Terraza El Trampolin, con vista al viñedo Buena Vista. Disfrute exquisitos platos elaborados por nuestro chef, maridado con una selección de 5 vinos Gran Reserva e Icono.',
180, 4, 10, 50000, 'Special', '10:00:00', '18:00:00', 0, TRUE),

('Batuco Paradise',
'Tour comienza en la Bodega de Invina en San Rafael. Recorrido completo idéntico a los tours standard: Jardín de variedades, Mirador El Trampolin, Area de recepción, bodega de vinos, área de embotellado.
Traslado hacia nuestro precioso campo Batuco.
Visita al campo para conocer los rincones especiales de donde nacen los vinos Iconos de Invina.',
300, 4, 10, 60000, 'Special', '10:00:00', '18:00:00', 0, TRUE),

('Maule Profundo',
'Tour comienza en la Bodega de Invina en San Rafael. Recorrido completo idéntico a los tours standard: Jardín de variedades, Mirador El Trampolin, Area de recepción, bodega de vinos, área de embotellado.
Traslado hacia Curtiduría (1 hr. 10min) para conocer un pueblo histórico de producción de vinos de uvas patrimoniales. Caminar por viñedos centenarios.
Almuerzo tradicional en casona familiar donde se elaboran vinos al estilo tradicional.
Después del almuerzo el tour continúa por caminos interiores (40 min.) hasta llegar a nuestro precioso campo Batuco. Visita al campo para conocer los rincones especiales de donde nacen los vinos Iconos de Invina. Degustación guiada de nuestros vinos Iconos.
Almuerzo casero en Curtiduría maridado con Rosa de Curtiduría Moscatel Rosado y Guanay País, Postre con Berry Nice
Degustación en cabaña Black Shack en Batuco con picoteo: Cuartel 4A Carmenere, DeCabeza Blend Mediterraneo, Secano Tempranillo, Ojos Verdes Red Blend',
300, 4, 10, 80000, 'Special', '10:00:00', '18:00:00', 0, TRUE);

-- ==========================================
-- 4. INSERT MENUS (all linked to Tour Bodega InVina = tour_id 1)
-- ==========================================
INSERT INTO menus (tour_id, name, description, price, is_active) VALUES
(1, 'Sierra Batuco', 'VINOS RESERVA SIERRA BATUCO, elegir 4 Reserva y deguste también nuestro Lone Rider Premium Selection Red Blend', 15000, TRUE),
(1, 'Tricky Rabbit', 'VINOS RESERVA TRICKY RABBIT elegir 4 Reserva y deguste también nuestro Tricky Fizz frizante de arándanos.', 15000, TRUE),
(1, 'Luma Chequen', 'Vinos de potencia y elegancia. Cada vino es elaborado de uvas proveniente de cuarteles de nuestros viñedos que han demostrado la más alta aptitud para resaltar la calidad y tipicidad de cada vino. Son vinos que tienen la potencia para evolucionar de forma excepcional con envejecimiento en barrica. Degustación de 4 vinos y deguste también IN, nuestro espumante premiado elaborado en el método tradicional de segunda fermentación en botella', 20000, TRUE),
(1, 'Carmenere, la Cepa Perdida', 'Deguste la cepa emblemática de Chile en diferentes niveles y mezclas de la viña premiada por producir el mejor Carmenere de Chile. Degustación de 5 vinos y deguste también nuestro Berry Nice, vino único 100% fermentado de arándanos.', 25000, TRUE),
(1, 'Íconos', 'La línea Icono de Invina, todos premiados con 90 puntos o más por críticos internacionalmente reconocidos. Vinos intensos, expresivos y sorprendente. Cada vino expresa su personalidad única, así creando una aventura degustativa', 35000, TRUE);

-- 5. Add Tour Images for Tour 1
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

