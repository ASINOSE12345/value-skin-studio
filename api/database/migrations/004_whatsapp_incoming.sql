-- Migración: Mensajes entrantes de WhatsApp y mejoras
-- Fecha: Diciembre 2024

-- Agregar campos de mensajes personalizados a whatsapp_config
ALTER TABLE whatsapp_config
ADD COLUMN IF NOT EXISTS cancellation_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS msg_confirmation TEXT,
ADD COLUMN IF NOT EXISTS msg_reminder_24h TEXT,
ADD COLUMN IF NOT EXISTS msg_reminder_1h TEXT,
ADD COLUMN IF NOT EXISTS msg_thankyou TEXT,
ADD COLUMN IF NOT EXISTS msg_cancellation TEXT;

-- Tabla de mensajes entrantes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_incoming (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_message_id VARCHAR(255) UNIQUE NOT NULL,
    from_phone VARCHAR(20) NOT NULL,
    from_name VARCHAR(255),
    message_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'audio', 'video', 'document', 'location', 'sticker', 'reaction'
    message_body TEXT,
    media_id VARCHAR(255),
    media_url TEXT,
    media_mime_type VARCHAR(100),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_name VARCHAR(255),
    location_address TEXT,
    context_message_id VARCHAR(255), -- Si es respuesta a otro mensaje
    status VARCHAR(20) DEFAULT 'received', -- 'received', 'read', 'replied'
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- Enlace automático si existe el cliente
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_phone ON whatsapp_incoming(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_client ON whatsapp_incoming(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_created ON whatsapp_incoming(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_status ON whatsapp_incoming(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_msg_id ON whatsapp_incoming(whatsapp_message_id);

-- Actualizar tabla de mensajes salientes para más campos
ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS template_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Políticas RLS
ALTER TABLE whatsapp_incoming ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_incoming_admin" ON whatsapp_incoming
    FOR ALL USING (true);

-- Vista para conversaciones (combina entrantes y salientes)
CREATE OR REPLACE VIEW whatsapp_conversations AS
SELECT
    id,
    phone as phone_number,
    'outgoing' as direction,
    message_type,
    message_text as body,
    status,
    client_id,
    created_at
FROM whatsapp_messages
UNION ALL
SELECT
    id,
    from_phone as phone_number,
    'incoming' as direction,
    message_type,
    message_body as body,
    status,
    client_id,
    created_at
FROM whatsapp_incoming
ORDER BY created_at DESC;
