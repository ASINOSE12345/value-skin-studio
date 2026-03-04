-- =====================================================
-- VALUE SKIN STUDIO - SCHEMA DE BASE DE DATOS
-- PostgreSQL / Supabase
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users (Usuarios administradores)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  avatar VARCHAR(500),
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'editor')),
  permissions TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  refresh_token TEXT,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busquedas rapidas
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- TABLA: site_config (Configuracion del sitio)
-- =====================================================
CREATE TABLE IF NOT EXISTS site_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name VARCHAR(100) DEFAULT 'Value Skin Studio',
  tagline VARCHAR(200) DEFAULT 'Bienestar Profesional en Posadas',
  description TEXT,
  logo_url VARCHAR(500),
  logo_alt VARCHAR(100),
  favicon_url VARCHAR(500),
  colors JSONB DEFAULT '{
    "primary": "#2C5F4F",
    "primaryDark": "#1F4538",
    "secondary": "#D4A59A",
    "accent": "#C9A86A",
    "background": "#F5F1E8",
    "white": "#FFFFFF",
    "grayStone": "#8C8C88",
    "greenWater": "#A8C9C1",
    "blackSoft": "#2B2B2B"
  }'::jsonb,
  contact JSONB DEFAULT '{
    "address": "Av. Costanera 1234",
    "city": "Posadas, Misiones",
    "phone": "+54 9 3764 XX-XXXX",
    "whatsapp": "+5493764XXXXXX",
    "email": "info@valueskinstudio.com",
    "hours": {
      "weekdays": "Lun-Vie: 9:00 - 20:00",
      "saturday": "Sabados: 9:00 - 14:00",
      "sunday": "Domingos: Cerrado"
    }
  }'::jsonb,
  social JSONB DEFAULT '{
    "instagram": "",
    "facebook": "",
    "tiktok": "",
    "youtube": ""
  }'::jsonb,
  seo JSONB DEFAULT '{
    "title": "Value Skin Studio - Bienestar Profesional en Posadas",
    "description": "Masajes terapeuticos y estetica de bienestar en Posadas, Misiones. Programas personalizados, spa movil para hoteles y bienestar corporativo.",
    "keywords": ["spa", "masajes", "bienestar", "posadas", "misiones", "estetica"]
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: banners
-- =====================================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  section VARCHAR(50) NOT NULL CHECK (section IN ('hero', 'cta', 'features', 'promo')),
  image_url VARCHAR(500) NOT NULL,
  image_alt VARCHAR(200),
  image_width INTEGER,
  image_height INTEGER,
  title VARCHAR(200),
  subtitle TEXT,
  cta_text VARCHAR(100),
  cta_link VARCHAR(500),
  overlay_enabled BOOLEAN DEFAULT true,
  overlay_color VARCHAR(100) DEFAULT 'rgba(44, 95, 79, 0.6)',
  overlay_opacity DECIMAL(3,2) DEFAULT 0.60,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_section ON banners(section);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order);

-- =====================================================
-- TABLA: services (Servicios/Programas)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(300),
  category VARCHAR(50) NOT NULL CHECK (category IN ('para-ti', 'hoteles', 'empresas', 'escuela')),
  sessions INTEGER,
  weeks INTEGER,
  per_session_minutes INTEGER,
  features TEXT[] DEFAULT '{}',
  base_price DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'ARS',
  price_text VARCHAR(100),
  per_unit VARCHAR(50) DEFAULT 'programa',
  image_url VARCHAR(500),
  icon TEXT,
  color VARCHAR(50),
  featured BOOLEAN DEFAULT false,
  badge VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(featured);

-- =====================================================
-- TABLA: clients (Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(30),
  whatsapp VARCHAR(30),
  birth_date DATE,
  gender VARCHAR(20),
  address_street VARCHAR(200),
  address_city VARCHAR(100),
  address_province VARCHAR(100),
  address_postal_code VARCHAR(20),
  client_type VARCHAR(30) DEFAULT 'individual' CHECK (client_type IN ('individual', 'hotel', 'empresa')),
  company_name VARCHAR(200),
  notes TEXT,
  source VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  newsletter BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vip')),
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- =====================================================
-- TABLA: promotions (Ofertas y Promociones)
-- =====================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  promo_type VARCHAR(30) CHECK (promo_type IN ('percentage', 'fixed', '2x1', 'bundle')),
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  applies_to_type VARCHAR(30) DEFAULT 'all' CHECK (applies_to_type IN ('all', 'category', 'services', 'clients')),
  applies_to_items UUID[] DEFAULT '{}',
  min_purchase DECIMAL(10,2),
  max_uses INTEGER,
  max_uses_per_client INTEGER,
  new_clients_only BOOLEAN DEFAULT false,
  combinable BOOLEAN DEFAULT false,
  code VARCHAR(50) UNIQUE,
  auto_apply BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  banner_image VARCHAR(500),
  show_on_home BOOLEAN DEFAULT false,
  show_on_services BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,
  total_discounted DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

-- =====================================================
-- TABLA: contacts (Contactos/Consultas)
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  contact_type VARCHAR(30) DEFAULT 'cliente' CHECK (contact_type IN ('cliente', 'hotel', 'empresa', 'escuela', 'otro')),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);

-- =====================================================
-- TABLA: appointments (Turnos/Citas)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name VARCHAR(100) NOT NULL,
  client_email VARCHAR(100) NOT NULL,
  client_phone VARCHAR(30) NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name VARCHAR(100) NOT NULL,
  program VARCHAR(100),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);

-- =====================================================
-- TABLA: content (Contenido dinamico)
-- =====================================================
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section VARCHAR(50) NOT NULL,
  content_key VARCHAR(100) NOT NULL,
  content_type VARCHAR(30) DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'image', 'list', 'json')),
  content_value JSONB,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section, content_key)
);

CREATE INDEX IF NOT EXISTS idx_content_section ON content(section);

-- =====================================================
-- TABLA: promotion_usage (Uso de promociones)
-- =====================================================
CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10,2),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_client ON promotion_usage(client_id);

-- =====================================================
-- FUNCIONES HELPER
-- =====================================================

-- Funcion para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_config_updated_at ON site_config;
CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar configuracion inicial del sitio (si no existe)
INSERT INTO site_config (id, site_name, tagline)
SELECT uuid_generate_v4(), 'Value Skin Studio', 'Bienestar Profesional en Posadas'
WHERE NOT EXISTS (SELECT 1 FROM site_config LIMIT 1);

-- Insertar banners iniciales
INSERT INTO banners (name, section, image_url, title, subtitle, active, display_order)
SELECT 'Hero Principal', 'hero', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1920&q=80', 'Bienestar Profesional en Posadas', 'Masajes terapeuticos | Estetica avanzada | Programas personalizados', true, 1
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE section = 'hero' LIMIT 1);

INSERT INTO banners (name, section, image_url, active, display_order)
SELECT 'CTA Final', 'cta', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80', true, 1
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE section = 'cta' LIMIT 1);

-- Insertar servicios iniciales (categoria: para-ti)
INSERT INTO services (name, slug, category, sessions, weeks, features, price_text, featured, badge, display_order, active)
SELECT 'Post-Operatorio', 'post-operatorio', 'para-ti', 8, 4,
  ARRAY['Drenaje linfatico manual', 'Presoterapia progresiva', 'Ultracavitacion', 'Radiofrecuencia'],
  'Desde $180.000', false, NULL, 1, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'post-operatorio');

INSERT INTO services (name, slug, category, sessions, weeks, features, price_text, featured, badge, display_order, active)
SELECT 'Reductor Intensivo', 'reductor-intensivo', 'para-ti', 6, 3,
  ARRAY['Ultracavitacion', 'Radiofrecuencia', 'Masaje reductor', 'Presoterapia'],
  'Desde $150.000', true, 'Mas Popular', 2, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'reductor-intensivo');

INSERT INTO services (name, slug, category, sessions, weeks, features, price_text, featured, badge, display_order, active)
SELECT 'Piernas Ligeras', 'piernas-ligeras', 'para-ti', 4, 4,
  ARRAY['Drenaje linfatico', 'Presoterapia', 'Criofrecuencia', 'Gel frio de regalo'],
  'Desde $80.000', false, NULL, 3, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'piernas-ligeras');

INSERT INTO services (name, slug, category, sessions, weeks, features, price_text, featured, badge, display_order, active)
SELECT 'Anti-Estres', 'anti-estres', 'para-ti', 6, 6,
  ARRAY['Masaje relajante 60''', 'Aromaterapia', 'Hot stones', 'Reflexologia podal'],
  'Desde $120.000', false, NULL, 4, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'anti-estres');

-- Insertar servicios corporativos (categoria: empresas)
INSERT INTO services (name, slug, category, description, price_text, per_unit, featured, badge, display_order, active)
SELECT 'Dia de Bienestar', 'dia-bienestar', 'empresas', 'Evento unico para equipos',
  '$8.000', 'por empleado', false, NULL, 1, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'dia-bienestar');

INSERT INTO services (name, slug, category, description, price_text, per_unit, featured, badge, display_order, active)
SELECT 'Programa Mensual', 'programa-mensual', 'empresas', '1 jornada por mes',
  '$7.000', 'por empleado/mes', true, 'Recomendado', 2, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'programa-mensual');

INSERT INTO services (name, slug, category, description, price_text, per_unit, featured, badge, display_order, active)
SELECT 'Beneficio Sin Costo', 'beneficio-sin-costo', 'empresas', 'Convenio empresa',
  '$0', 'para la empresa', false, NULL, 3, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'beneficio-sin-costo');

-- Insertar curso de escuela
INSERT INTO services (name, slug, category, description, sessions, price_text, display_order, active)
SELECT 'Masaje Hotelero Profesional', 'masaje-hotelero-profesional', 'escuela',
  '2 dias intensivos | Cupos limitados: 8 personas', 2, '$90.000', 1, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'masaje-hotelero-profesional');

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Opcional para Supabase
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- Politicas de lectura publica para contenido del sitio
CREATE POLICY "Permitir lectura publica de site_config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de banners activos" ON banners FOR SELECT USING (active = true);
CREATE POLICY "Permitir lectura publica de servicios activos" ON services FOR SELECT USING (active = true);
CREATE POLICY "Permitir lectura publica de promociones activas" ON promotions FOR SELECT USING (active = true);
CREATE POLICY "Permitir lectura publica de contenido activo" ON content FOR SELECT USING (active = true);

-- Politica para insertar contactos (publico)
CREATE POLICY "Permitir insertar contactos" ON contacts FOR INSERT WITH CHECK (true);

-- Politica para insertar turnos (publico)
CREATE POLICY "Permitir insertar turnos" ON appointments FOR INSERT WITH CHECK (true);

-- NOTA: Las operaciones de admin se realizan con el service_key que bypasea RLS
