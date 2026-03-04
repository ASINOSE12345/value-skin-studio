-- =====================================================
-- MIGRACIÓN 002: Tablas CRM Completo
-- Value Skin Studio
-- =====================================================

-- Extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: availability (Horarios de trabajo)
-- =====================================================
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar horarios por defecto (Lunes a Viernes 9-20, Sábado 9-14)
INSERT INTO availability (day_of_week, start_time, end_time, is_available) VALUES
  (1, '09:00', '20:00', true),  -- Lunes
  (2, '09:00', '20:00', true),  -- Martes
  (3, '09:00', '20:00', true),  -- Miércoles
  (4, '09:00', '20:00', true),  -- Jueves
  (5, '09:00', '20:00', true),  -- Viernes
  (6, '09:00', '14:00', true),  -- Sábado
  (0, '00:00', '00:00', false)  -- Domingo (cerrado)
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLA: blocked_times (Bloqueos de horario)
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: invoices (Facturas/Recibos)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  type VARCHAR(20) DEFAULT 'receipt' CHECK (type IN ('invoice', 'receipt')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  payment_method VARCHAR(50),
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: invoice_items (Items de factura)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: whatsapp_messages (Mensajes WhatsApp)
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'template', 'media', 'interactive')),
  template_name VARCHAR(100),
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  whatsapp_message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: scheduled_notifications (Notificaciones programadas)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('reminder_24h', 'reminder_1h', 'confirmation', 'thankyou', 'invoice', 'birthday', 'promo')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: marketing_config (Configuración de marketing)
-- =====================================================
CREATE TABLE IF NOT EXISTS marketing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gtm_id VARCHAR(50),
  ga4_id VARCHAR(50),
  fb_pixel_id VARCHAR(50),
  tiktok_pixel_id VARCHAR(50),
  google_ads_id VARCHAR(50),
  hotjar_id VARCHAR(50),
  custom_head_scripts TEXT,
  custom_body_scripts TEXT,
  cookie_consent_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración de marketing por defecto
INSERT INTO marketing_config (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLA: business_config (Configuración del negocio)
-- =====================================================
CREATE TABLE IF NOT EXISTS business_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(200) DEFAULT 'Value Skin Studio',
  legal_name VARCHAR(200),
  tax_id VARCHAR(50),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'ARS',
  currency_symbol VARCHAR(5) DEFAULT '$',
  invoice_prefix VARCHAR(10) DEFAULT 'VSS',
  invoice_next_number INTEGER DEFAULT 1,
  invoice_terms TEXT,
  invoice_footer TEXT,
  appointment_buffer_minutes INTEGER DEFAULT 15,
  appointment_default_duration INTEGER DEFAULT 60,
  allow_online_booking BOOLEAN DEFAULT true,
  require_deposit BOOLEAN DEFAULT false,
  deposit_percentage DECIMAL(5,2) DEFAULT 0,
  cancellation_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración de negocio por defecto
INSERT INTO business_config (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLA: notification_templates (Plantillas de notificación)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  variables TEXT[], -- Variables disponibles: {client_name}, {appointment_date}, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar plantillas por defecto
INSERT INTO notification_templates (name, type, channel, subject, content, variables) VALUES
  ('confirmation_whatsapp', 'confirmation', 'whatsapp', NULL,
   'Hola {client_name}! Tu cita en Value Skin Studio está confirmada:\n📅 {appointment_date} a las {appointment_time}\n💆 Servicio: {service_name}\n📍 {business_address}\n\nPara cancelar o reprogramar, responde a este mensaje.',
   ARRAY['client_name', 'appointment_date', 'appointment_time', 'service_name', 'business_address']),

  ('reminder_24h_whatsapp', 'reminder_24h', 'whatsapp', NULL,
   'Hola {client_name}! Te recordamos que mañana tienes cita:\n📅 {appointment_date} a las {appointment_time}\n💆 {service_name}\n\n¡Te esperamos!',
   ARRAY['client_name', 'appointment_date', 'appointment_time', 'service_name']),

  ('reminder_1h_whatsapp', 'reminder_1h', 'whatsapp', NULL,
   'Hola {client_name}! Tu cita es en 1 hora:\n⏰ {appointment_time}\n💆 {service_name}\n\n¡Te esperamos!',
   ARRAY['client_name', 'appointment_time', 'service_name']),

  ('thankyou_whatsapp', 'thankyou', 'whatsapp', NULL,
   'Hola {client_name}! Gracias por visitarnos hoy en Value Skin Studio.\n\n¿Cómo te sentiste con tu {service_name}?\n\n¡Esperamos verte pronto! 💆‍♀️',
   ARRAY['client_name', 'service_name']),

  ('invoice_whatsapp', 'invoice', 'whatsapp', NULL,
   'Hola {client_name}! Aquí está tu recibo de Value Skin Studio:\n💰 Total: {currency_symbol}{total}\n📄 Recibo #{invoice_number}\n\nGracias por tu preferencia!',
   ARRAY['client_name', 'currency_symbol', 'total', 'invoice_number'])
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- ACTUALIZAR TABLA: clients (Agregar campos CRM)
-- =====================================================
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS acquisition_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(20) DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- ACTUALIZAR TABLA: appointments (Agregar campos)
-- =====================================================
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS thankyou_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#2C5F4F';

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_client ON whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON scheduled_notifications(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para generar número de factura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix VARCHAR(10);
  next_num INTEGER;
  year_str VARCHAR(4);
BEGIN
  SELECT invoice_prefix, invoice_next_number INTO prefix, next_num FROM business_config LIMIT 1;
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  NEW.invoice_number := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  UPDATE business_config SET invoice_next_number = next_num + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para número de factura
DROP TRIGGER IF EXISTS trigger_invoice_number ON invoices;
CREATE TRIGGER trigger_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- Función para actualizar estadísticas del cliente
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
    UPDATE clients SET
      visit_count = visit_count + 1,
      last_visit_at = NOW(),
      total_spent = total_spent + COALESCE(NEW.final_price, NEW.price, 0)
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para estadísticas del cliente
DROP TRIGGER IF EXISTS trigger_client_stats ON appointments;
CREATE TRIGGER trigger_client_stats
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_client_stats();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_availability_updated ON availability;
CREATE TRIGGER trigger_availability_updated BEFORE UPDATE ON availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_invoices_updated ON invoices;
CREATE TRIGGER trigger_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_marketing_updated ON marketing_config;
CREATE TRIGGER trigger_marketing_updated BEFORE UPDATE ON marketing_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_business_updated ON business_config;
CREATE TRIGGER trigger_business_updated BEFORE UPDATE ON business_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para service_role (acceso completo)
CREATE POLICY "Service role full access availability" ON availability FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access blocked_times" ON blocked_times FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access invoices" ON invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access invoice_items" ON invoice_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access whatsapp_messages" ON whatsapp_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access scheduled_notifications" ON scheduled_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access marketing_config" ON marketing_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access business_config" ON business_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access notification_templates" ON notification_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE availability IS 'Horarios de disponibilidad del negocio por día de la semana';
COMMENT ON TABLE blocked_times IS 'Bloqueos temporales de horarios (vacaciones, eventos, etc.)';
COMMENT ON TABLE invoices IS 'Facturas y recibos generados';
COMMENT ON TABLE invoice_items IS 'Items/líneas de cada factura';
COMMENT ON TABLE whatsapp_messages IS 'Historial de mensajes WhatsApp enviados y recibidos';
COMMENT ON TABLE scheduled_notifications IS 'Notificaciones programadas para envío automático';
COMMENT ON TABLE marketing_config IS 'Configuración de pixels, tags y scripts de marketing';
COMMENT ON TABLE business_config IS 'Configuración general del negocio (fiscal, facturación, etc.)';
COMMENT ON TABLE notification_templates IS 'Plantillas de mensajes para notificaciones';
