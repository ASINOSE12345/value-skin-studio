-- Migración: Configuración de WhatsApp Business
-- Fecha: Diciembre 2024

-- Tabla de configuración de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    phone_number_id VARCHAR(100),
    access_token TEXT,
    business_account_id VARCHAR(100),
    webhook_verify_token VARCHAR(255),
    confirmation_enabled BOOLEAN DEFAULT false,
    reminder_24h_enabled BOOLEAN DEFAULT false,
    reminder_1h_enabled BOOLEAN DEFAULT false,
    thankyou_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Tabla de historial de mensajes enviados
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder_24h', 'reminder_1h', 'thankyou', 'custom'
    message_text TEXT,
    whatsapp_message_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_appointment ON whatsapp_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client ON whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at);

-- Insertar configuración inicial
INSERT INTO whatsapp_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Políticas RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden acceder
CREATE POLICY "whatsapp_config_admin" ON whatsapp_config
    FOR ALL USING (true);

CREATE POLICY "whatsapp_messages_admin" ON whatsapp_messages
    FOR ALL USING (true);
