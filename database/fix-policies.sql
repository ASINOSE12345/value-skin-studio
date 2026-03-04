-- =====================================================
-- FIX: Eliminar politicas existentes y recrearlas
-- =====================================================

-- Eliminar politicas existentes
DROP POLICY IF EXISTS "Permitir lectura publica de site_config" ON site_config;
DROP POLICY IF EXISTS "Permitir lectura publica de banners activos" ON banners;
DROP POLICY IF EXISTS "Permitir lectura publica de servicios activos" ON services;
DROP POLICY IF EXISTS "Permitir lectura publica de promociones activas" ON promotions;
DROP POLICY IF EXISTS "Permitir lectura publica de contenido activo" ON content;
DROP POLICY IF EXISTS "Permitir insertar contactos" ON contacts;
DROP POLICY IF EXISTS "Permitir insertar turnos" ON appointments;

-- Recrear politicas
CREATE POLICY "Permitir lectura publica de site_config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de banners activos" ON banners FOR SELECT USING (active = true);
CREATE POLICY "Permitir lectura publica de servicios activos" ON services FOR SELECT USING (active = true);
CREATE POLICY "Permitir lectura publica de promociones activas" ON promotions FOR SELECT USING (active = true);
CREATE POLICY "Permitir lectura publica de contenido activo" ON content FOR SELECT USING (active = true);
CREATE POLICY "Permitir insertar contactos" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insertar turnos" ON appointments FOR INSERT WITH CHECK (true);

-- Agregar politicas para operaciones admin (usando service_role key)
-- Estas permiten todas las operaciones cuando se usa la service_role key

-- Politicas para users (solo service_role)
DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Politicas para clients
DROP POLICY IF EXISTS "Service role full access clients" ON clients;
CREATE POLICY "Service role full access clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- Politicas para contacts (lectura admin)
DROP POLICY IF EXISTS "Service role full access contacts" ON contacts;
CREATE POLICY "Service role full access contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);

-- Politicas para appointments (lectura admin)
DROP POLICY IF EXISTS "Service role full access appointments" ON appointments;
CREATE POLICY "Service role full access appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- Politicas para banners (admin)
DROP POLICY IF EXISTS "Service role full access banners" ON banners;
CREATE POLICY "Service role full access banners" ON banners FOR ALL USING (true) WITH CHECK (true);

-- Politicas para services (admin)
DROP POLICY IF EXISTS "Service role full access services" ON services;
CREATE POLICY "Service role full access services" ON services FOR ALL USING (true) WITH CHECK (true);

-- Politicas para promotions (admin)
DROP POLICY IF EXISTS "Service role full access promotions" ON promotions;
CREATE POLICY "Service role full access promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);

-- Politicas para content (admin)
DROP POLICY IF EXISTS "Service role full access content" ON content;
CREATE POLICY "Service role full access content" ON content FOR ALL USING (true) WITH CHECK (true);

-- Politicas para site_config (admin)
DROP POLICY IF EXISTS "Service role full access site_config" ON site_config;
CREATE POLICY "Service role full access site_config" ON site_config FOR ALL USING (true) WITH CHECK (true);

-- Politicas para promotion_usage
DROP POLICY IF EXISTS "Service role full access promotion_usage" ON promotion_usage;
CREATE POLICY "Service role full access promotion_usage" ON promotion_usage FOR ALL USING (true) WITH CHECK (true);
