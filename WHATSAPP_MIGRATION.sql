-- ============================================
-- MIGRACION DE WHATSAPP PARA VALUE SKIN STUDIO
-- ============================================
-- Ejecutar en: https://supabase.com/dashboard/project/rbsnbyyphezjvyehwrby/sql/new

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: whatsapp_config
-- Configuración de WhatsApp Business API
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    phone_number_id VARCHAR(100),
    access_token TEXT,
    business_account_id VARCHAR(100),
    webhook_verify_token VARCHAR(255) DEFAULT 'vss-webhook-2024',
    confirmation_enabled BOOLEAN DEFAULT false,
    reminder_24h_enabled BOOLEAN DEFAULT false,
    reminder_1h_enabled BOOLEAN DEFAULT false,
    thankyou_enabled BOOLEAN DEFAULT false,
    cancellation_enabled BOOLEAN DEFAULT true,
    msg_confirmation TEXT,
    msg_reminder_24h TEXT,
    msg_reminder_1h TEXT,
    msg_thankyou TEXT,
    msg_cancellation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================
-- TABLA: whatsapp_messages
-- Historial de mensajes enviados
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_text TEXT,
    whatsapp_message_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    template_name VARCHAR(100),
    media_url TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: whatsapp_incoming
-- Mensajes entrantes de clientes
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_incoming (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_message_id VARCHAR(255) UNIQUE NOT NULL,
    from_phone VARCHAR(20) NOT NULL,
    from_name VARCHAR(255),
    message_type VARCHAR(50) NOT NULL,
    message_body TEXT,
    media_id VARCHAR(255),
    media_url TEXT,
    media_mime_type VARCHAR(100),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_name VARCHAR(255),
    location_address TEXT,
    context_message_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'received',
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_appointment ON whatsapp_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client ON whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_phone ON whatsapp_incoming(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_client ON whatsapp_incoming(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_created ON whatsapp_incoming(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_status ON whatsapp_incoming(status);

-- ============================================
-- DATOS INICIALES
-- ============================================
INSERT INTO whatsapp_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_incoming ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo (para admin via service_role)
DROP POLICY IF EXISTS "whatsapp_config_admin" ON whatsapp_config;
CREATE POLICY "whatsapp_config_admin" ON whatsapp_config FOR ALL USING (true);

DROP POLICY IF EXISTS "whatsapp_messages_admin" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages_admin" ON whatsapp_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "whatsapp_incoming_admin" ON whatsapp_incoming;
CREATE POLICY "whatsapp_incoming_admin" ON whatsapp_incoming FOR ALL USING (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'whatsapp_config' as tabla, COUNT(*) as registros FROM whatsapp_config
UNION ALL
SELECT 'whatsapp_messages', COUNT(*) FROM whatsapp_messages
UNION ALL
SELECT 'whatsapp_incoming', COUNT(*) FROM whatsapp_incoming;
