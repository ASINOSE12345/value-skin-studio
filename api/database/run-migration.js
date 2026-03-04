// Script para ejecutar migraciones de WhatsApp en Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Ejecutando migraciones de WhatsApp...\n');

  // Migración 003: Crear tabla whatsapp_config
  console.log('📦 Creando tabla whatsapp_config...');

  // Primero intentamos insertar en la tabla para ver si existe
  const { error: checkError } = await supabase
    .from('whatsapp_config')
    .select('id')
    .limit(1);

  if (checkError && checkError.code === 'PGRST205') {
    console.log('⚠️  La tabla whatsapp_config no existe.');
    console.log('');
    console.log('Por favor, ejecuta este SQL en Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/rbsnbyyphezjvyehwrby/sql/new');
    console.log('');
    console.log('='.repeat(60));
    console.log(`
-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de configuración de WhatsApp
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

-- Tabla de historial de mensajes enviados
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

-- Tabla de mensajes entrantes de WhatsApp
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_appointment ON whatsapp_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client ON whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_phone ON whatsapp_incoming(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_client ON whatsapp_incoming(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_created ON whatsapp_incoming(created_at DESC);

-- Insertar configuración inicial
INSERT INTO whatsapp_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Políticas RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_incoming ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_config_admin" ON whatsapp_config FOR ALL USING (true);
CREATE POLICY "whatsapp_messages_admin" ON whatsapp_messages FOR ALL USING (true);
CREATE POLICY "whatsapp_incoming_admin" ON whatsapp_incoming FOR ALL USING (true);
`);
    console.log('='.repeat(60));
    return;
  }

  console.log('✅ Tabla whatsapp_config ya existe');

  // Verificar si hay datos
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('*')
    .single();

  if (config) {
    console.log('\n📊 Configuración actual de WhatsApp:');
    console.log('   - Phone Number ID:', config.phone_number_id || '(no configurado)');
    console.log('   - Business Account ID:', config.business_account_id || '(no configurado)');
    console.log('   - Access Token:', config.access_token ? '(configurado)' : '(no configurado)');
    console.log('   - Confirmación habilitada:', config.confirmation_enabled ? 'Sí' : 'No');
    console.log('   - Recordatorio 24h:', config.reminder_24h_enabled ? 'Sí' : 'No');
    console.log('   - Recordatorio 1h:', config.reminder_1h_enabled ? 'Sí' : 'No');
  }

  console.log('\n✅ Migraciones completadas!');
}

runMigrations().catch(console.error);
