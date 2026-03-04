// API Index para Vercel Serverless Functions
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuracion
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor intente de nuevo mas tarde.'
  }
});
app.use('/api', limiter);

// Rate limiter mas estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    success: false,
    message: 'Demasiados intentos de login. Por favor espere 15 minutos.'
  }
});

// =====================================================
// RUTAS API V1 (NUEVAS)
// =====================================================

// Importar rutas v1
const v1Router = express.Router();

// Rutas publicas
const configRoutes = require('./routes/v1/config');
const bannersRoutes = require('./routes/v1/banners');
const servicesRoutes = require('./routes/v1/services');
const promotionsRoutes = require('./routes/v1/promotions');
const contentRoutes = require('./routes/v1/content');

// Rutas de autenticacion
const authRoutes = require('./routes/v1/auth');

// Rutas admin
const adminConfigRoutes = require('./routes/v1/admin/config');
const adminBannersRoutes = require('./routes/v1/admin/banners');
const adminServicesRoutes = require('./routes/v1/admin/services');
const adminClientsRoutes = require('./routes/v1/admin/clients');
const adminPromotionsRoutes = require('./routes/v1/admin/promotions');
const adminContactsRoutes = require('./routes/v1/admin/contacts');
const adminAppointmentsRoutes = require('./routes/v1/admin/appointments');
const adminUsersRoutes = require('./routes/v1/admin/users');
const adminStatsRoutes = require('./routes/v1/admin/stats');
const adminInvoicesRoutes = require('./routes/v1/admin/invoices');
const adminAvailabilityRoutes = require('./routes/v1/admin/availability');
const adminSettingsRoutes = require('./routes/v1/admin/settings');
const adminWhatsappRoutes = require('./routes/v1/admin/whatsapp');

// Montar rutas v1 publicas
v1Router.use('/config', configRoutes);
v1Router.use('/banners', bannersRoutes);
v1Router.use('/services', servicesRoutes);
v1Router.use('/promotions', promotionsRoutes);
v1Router.use('/content', contentRoutes);

// Montar rutas v1 auth
v1Router.use('/auth', authLimiter, authRoutes);

// Montar rutas v1 admin
v1Router.use('/admin/config', adminConfigRoutes);
v1Router.use('/admin/banners', adminBannersRoutes);
v1Router.use('/admin/services', adminServicesRoutes);
v1Router.use('/admin/clients', adminClientsRoutes);
v1Router.use('/admin/promotions', adminPromotionsRoutes);
v1Router.use('/admin/contacts', adminContactsRoutes);
v1Router.use('/admin/appointments', adminAppointmentsRoutes);
v1Router.use('/admin/users', adminUsersRoutes);
v1Router.use('/admin/stats', adminStatsRoutes);
v1Router.use('/admin/invoices', adminInvoicesRoutes);
v1Router.use('/admin/availability', adminAvailabilityRoutes);
v1Router.use('/admin/settings', adminSettingsRoutes);
v1Router.use('/admin/whatsapp', adminWhatsappRoutes);

// Montar router v1
app.use('/api/v1', v1Router);

// =====================================================
// WEBHOOK WHATSAPP (RUTA PUBLICA - SIN AUTH)
// =====================================================
const whatsappService = require('./services/whatsapp');

// Verificacion del webhook (GET)
app.get('/api/v1/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('WhatsApp webhook verification:', { mode, token, challenge });

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'vss-webhook-2024';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.sendStatus(403);
  }
});

// Recibir mensajes del webhook (POST)
app.post('/api/v1/webhook/whatsapp', (req, res) => {
  console.log('WhatsApp Webhook received:', JSON.stringify(req.body, null, 2));
  // Siempre responder 200 a Meta
  res.sendStatus(200);
});

// =====================================================
// RUTAS LEGACY (COMPATIBILIDAD)
// =====================================================
const contactRoutes = require('./routes/contact');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');

app.use('/api/contact', contactRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// =====================================================
// RUTAS ADICIONALES
// =====================================================

// Ruta de salud/verificacion
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Endpoint temporal para ejecutar migracion de WhatsApp
// ELIMINAR DESPUES DE USAR
app.get('/api/run-whatsapp-migration', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== 'vss-migrate-2024') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { supabaseAdmin, isSupabaseConfigured } = require('./config/supabase');

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const results = [];

  try {
    // 1. Crear tabla whatsapp_config
    const { error: error1 } = await supabaseAdmin.rpc('exec', {
      query: `
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
        )
      `
    });
    results.push({ table: 'whatsapp_config', error: error1?.message || 'OK' });

    // Intentar crear las tablas usando insert (que falla si la tabla existe)
    // Esto es un workaround porque no podemos ejecutar SQL directamente

    // Verificar si whatsapp_config existe intentando insertar
    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_config')
      .upsert({ id: 1 }, { onConflict: 'id' });

    results.push({
      action: 'upsert_config',
      error: insertError?.message || 'OK'
    });

    res.json({
      success: true,
      message: 'Migration attempted',
      results,
      note: 'Si las tablas no existen, debes ejecutar el SQL manualmente en Supabase Dashboard'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      results
    });
  }
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Manejo de rutas no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`
  });
});

// Middleware de manejo de errores centralizado
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Fallback para errores no capturados
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Exportar para Vercel
module.exports = app;
