// Rutas de configuración WhatsApp Business
const express = require('express');
const router = express.Router();
const whatsappService = require('../../../services/whatsapp');
const notificationService = require('../../../services/notificationService');
const { asyncHandler, createError } = require('../../../middleware/errorHandler');
const supabase = require('../../../config/supabase');

// GET /api/v1/admin/whatsapp/status - Estado de la integración
router.get('/status', asyncHandler(async (req, res) => {
  const isConfigured = whatsappService.isConfigured();

  // Obtener configuración de notificaciones de la BD
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('*')
    .single();

  res.json({
    success: true,
    data: {
      configured: isConfigured,
      notifications: config || {
        confirmation_enabled: false,
        reminder_24h_enabled: false,
        reminder_1h_enabled: false,
        thankyou_enabled: false
      }
    }
  });
}));

// PUT /api/v1/admin/whatsapp/config - Guardar configuración
router.put('/config', asyncHandler(async (req, res) => {
  const {
    phone_number_id,
    access_token,
    business_account_id,
    webhook_verify_token
  } = req.body;

  // Guardar en la BD (encriptado en producción)
  const { data, error } = await supabase
    .from('whatsapp_config')
    .upsert({
      id: 1,
      phone_number_id,
      access_token,
      business_account_id,
      webhook_verify_token,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    // Si la tabla no existe, la creamos
    if (error.code === '42P01') {
      throw createError.internal('Tabla whatsapp_config no existe. Ejecutar migración.');
    }
    throw createError.internal(error.message);
  }

  res.json({
    success: true,
    message: 'Configuración de WhatsApp guardada',
    data
  });
}));

// PUT /api/v1/admin/whatsapp/notifications - Configurar notificaciones
router.put('/notifications', asyncHandler(async (req, res) => {
  const {
    confirmation_enabled,
    reminder_24h_enabled,
    reminder_1h_enabled,
    thankyou_enabled,
    cancellation_enabled,
    // Mensajes personalizados
    msg_confirmation,
    msg_reminder_24h,
    msg_reminder_1h,
    msg_thankyou,
    msg_cancellation
  } = req.body;

  const { data, error } = await supabase
    .from('whatsapp_config')
    .upsert({
      id: 1,
      confirmation_enabled: confirmation_enabled ?? false,
      reminder_24h_enabled: reminder_24h_enabled ?? false,
      reminder_1h_enabled: reminder_1h_enabled ?? false,
      thankyou_enabled: thankyou_enabled ?? false,
      cancellation_enabled: cancellation_enabled ?? true,
      // Mensajes personalizados
      msg_confirmation: msg_confirmation || null,
      msg_reminder_24h: msg_reminder_24h || null,
      msg_reminder_1h: msg_reminder_1h || null,
      msg_thankyou: msg_thankyou || null,
      msg_cancellation: msg_cancellation || null,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw createError.internal(error.message);
  }

  res.json({
    success: true,
    message: 'Configuración de notificaciones guardada',
    data
  });
}));

// POST /api/v1/admin/whatsapp/test - Enviar mensaje de prueba
router.post('/test', asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw createError.badRequest('Número de teléfono requerido');
  }

  if (!whatsappService.isConfigured()) {
    throw createError.badRequest('WhatsApp no está configurado. Configura las credenciales primero.');
  }

  const result = await whatsappService.sendTextMessage(
    phone,
    '¡Hola! 🌿 Este es un mensaje de prueba de Value Skin Studio. La integración de WhatsApp está funcionando correctamente. ✅'
  );

  res.json({
    success: true,
    message: 'Mensaje de prueba enviado',
    data: result
  });
}));

// POST /api/v1/admin/whatsapp/send-confirmation - Enviar confirmación de cita
router.post('/send-confirmation', asyncHandler(async (req, res) => {
  const { phone, clientName, serviceName, date, time } = req.body;

  if (!phone || !clientName || !serviceName || !date || !time) {
    throw createError.badRequest('Faltan datos requeridos');
  }

  const result = await whatsappService.sendAppointmentConfirmation(
    phone, clientName, serviceName, date, time
  );

  res.json({
    success: true,
    message: 'Confirmación enviada',
    data: result
  });
}));

// POST /api/v1/admin/whatsapp/send-reminder - Enviar recordatorio
router.post('/send-reminder', asyncHandler(async (req, res) => {
  const { phone, clientName, serviceName, date, time, type } = req.body;

  if (!phone || !clientName || !serviceName) {
    throw createError.badRequest('Faltan datos requeridos');
  }

  let result;
  if (type === '1h') {
    result = await whatsappService.sendAppointmentReminder1h(phone, clientName, serviceName, time);
  } else {
    result = await whatsappService.sendAppointmentReminder24h(phone, clientName, serviceName, date, time);
  }

  res.json({
    success: true,
    message: 'Recordatorio enviado',
    data: result
  });
}));

// POST /api/v1/admin/whatsapp/send-thankyou - Enviar agradecimiento
router.post('/send-thankyou', asyncHandler(async (req, res) => {
  const { phone, clientName, serviceName } = req.body;

  if (!phone || !clientName || !serviceName) {
    throw createError.badRequest('Faltan datos requeridos');
  }

  const result = await whatsappService.sendThankYou(phone, clientName, serviceName);

  res.json({
    success: true,
    message: 'Mensaje de agradecimiento enviado',
    data: result
  });
}));

// Webhook para recibir mensajes de WhatsApp (Meta)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = whatsappService.verifyWebhook(mode, token, challenge);

  if (result) {
    res.status(200).send(result);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook', asyncHandler(async (req, res) => {
  // Procesar mensajes entrantes (para futuras implementaciones)
  console.log('WhatsApp Webhook:', JSON.stringify(req.body, null, 2));

  // Siempre responder 200 a Meta
  res.sendStatus(200);
}));

// GET /api/v1/admin/whatsapp/messages - Historial de mensajes
router.get('/messages', asyncHandler(async (req, res) => {
  const { appointmentId, clientId, page = 1, limit = 50 } = req.query;

  const result = await notificationService.getMessageHistory({
    appointmentId,
    clientId,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    ...result
  });
}));

// POST /api/v1/admin/whatsapp/process-reminders - Ejecutar recordatorios (para cron)
// Este endpoint puede ser llamado por Vercel Cron o un servicio externo
router.post('/process-reminders', asyncHandler(async (req, res) => {
  // Verificar token secreto para seguridad del cron
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const expectedSecret = process.env.CRON_SECRET || 'vss-cron-2024';

  if (cronSecret !== expectedSecret) {
    throw createError.unauthorized('Token de cron inválido');
  }

  const results = await notificationService.processReminders();

  res.json({
    success: true,
    message: 'Recordatorios procesados',
    data: results
  });
}));

// GET /api/v1/admin/whatsapp/stats - Estadísticas de mensajes
router.get('/stats', asyncHandler(async (req, res) => {
  const { supabaseAdmin, isSupabaseConfigured } = require('../../../config/supabase');

  if (!isSupabaseConfigured()) {
    return res.json({
      success: true,
      data: {
        total: 0,
        sent: 0,
        failed: 0,
        byType: {}
      }
    });
  }

  // Estadísticas generales
  const { data: messages, error } = await supabaseAdmin
    .from('whatsapp_messages')
    .select('status, message_type');

  if (error) {
    throw createError.internal(error.message);
  }

  const stats = {
    total: messages.length,
    sent: messages.filter(m => m.status === 'sent').length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    failed: messages.filter(m => m.status === 'failed').length,
    byType: {}
  };

  // Contar por tipo
  messages.forEach(m => {
    if (!stats.byType[m.message_type]) {
      stats.byType[m.message_type] = 0;
    }
    stats.byType[m.message_type]++;
  });

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;
