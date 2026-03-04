// Servicio de Notificaciones - Integra WhatsApp con Citas
const whatsappService = require('./whatsapp');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

class NotificationService {
  constructor() {
    this.config = null;
  }

  // Obtener configuracion de notificaciones desde BD
  async getConfig() {
    if (!isSupabaseConfigured()) {
      return {
        confirmation_enabled: false,
        reminder_24h_enabled: false,
        reminder_1h_enabled: false,
        thankyou_enabled: false
      };
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_config')
        .select('*')
        .single();

      if (error) {
        console.log('WhatsApp config not found, using defaults');
        return {
          confirmation_enabled: false,
          reminder_24h_enabled: false,
          reminder_1h_enabled: false,
          thankyou_enabled: false
        };
      }

      this.config = data;
      return data;
    } catch (err) {
      console.error('Error getting notification config:', err);
      return {
        confirmation_enabled: false,
        reminder_24h_enabled: false,
        reminder_1h_enabled: false,
        thankyou_enabled: false
      };
    }
  }

  // Registrar mensaje enviado en la BD
  async logMessage(appointmentId, clientId, phone, messageType, messageText, whatsappMessageId, status = 'sent', errorMessage = null) {
    if (!isSupabaseConfigured()) return;

    try {
      await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          appointment_id: appointmentId,
          client_id: clientId,
          phone,
          message_type: messageType,
          message_text: messageText,
          whatsapp_message_id: whatsappMessageId,
          status,
          error_message: errorMessage
        });
    } catch (err) {
      console.error('Error logging WhatsApp message:', err);
    }
  }

  // Formatear fecha para mostrar
  formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  }

  // Formatear hora para mostrar
  formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  // Reemplazar variables en mensaje personalizado
  replaceVariables(template, vars) {
    if (!template) return null;
    let message = template;
    if (vars.nombre) message = message.replace(/{nombre}/g, vars.nombre);
    if (vars.servicio) message = message.replace(/{servicio}/g, vars.servicio);
    if (vars.fecha) message = message.replace(/{fecha}/g, vars.fecha);
    if (vars.hora) message = message.replace(/{hora}/g, vars.hora);
    return message;
  }

  // =====================================================
  // NOTIFICACIONES DE CITAS
  // =====================================================

  // Enviar confirmacion de cita (cuando se crea o confirma)
  async sendAppointmentConfirmation(appointment) {
    const config = await this.getConfig();

    if (!config.confirmation_enabled) {
      console.log('Confirmation notifications disabled');
      return { sent: false, reason: 'disabled' };
    }

    if (!whatsappService.isConfigured()) {
      console.log('WhatsApp not configured');
      return { sent: false, reason: 'whatsapp_not_configured' };
    }

    const phone = appointment.client_phone || appointment.clientPhone;
    const clientName = appointment.client_name || appointment.clientName;
    const serviceName = appointment.service_name || appointment.service;
    const date = this.formatDate(appointment.appointment_date || appointment.date);
    const time = this.formatTime(appointment.appointment_time || appointment.time);

    if (!phone) {
      return { sent: false, reason: 'no_phone' };
    }

    try {
      // Usar mensaje personalizado si existe
      let result;
      if (config.msg_confirmation) {
        const customMessage = this.replaceVariables(config.msg_confirmation, {
          nombre: clientName, servicio: serviceName, fecha: date, hora: time
        });
        result = await whatsappService.sendTextMessage(phone, customMessage);
      } else {
        result = await whatsappService.sendAppointmentConfirmation(
          phone, clientName, serviceName, date, time
        );
      }

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'confirmation',
        `Confirmacion de cita: ${serviceName} - ${date} ${time}`,
        result.messageId,
        'sent'
      );

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending confirmation:', error);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'confirmation',
        null,
        null,
        'failed',
        error.message
      );

      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // Enviar recordatorio 24h antes
  async sendReminder24h(appointment) {
    const config = await this.getConfig();

    if (!config.reminder_24h_enabled) {
      return { sent: false, reason: 'disabled' };
    }

    if (!whatsappService.isConfigured()) {
      return { sent: false, reason: 'whatsapp_not_configured' };
    }

    const phone = appointment.client_phone || appointment.clientPhone;
    const clientName = appointment.client_name || appointment.clientName;
    const serviceName = appointment.service_name || appointment.service;
    const date = this.formatDate(appointment.appointment_date || appointment.date);
    const time = this.formatTime(appointment.appointment_time || appointment.time);

    if (!phone) {
      return { sent: false, reason: 'no_phone' };
    }

    try {
      const result = await whatsappService.sendAppointmentReminder24h(
        phone, clientName, serviceName, date, time
      );

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'reminder_24h',
        `Recordatorio 24h: ${serviceName} - ${date} ${time}`,
        result.messageId,
        'sent'
      );

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending 24h reminder:', error);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'reminder_24h',
        null,
        null,
        'failed',
        error.message
      );

      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // Enviar recordatorio 1h antes
  async sendReminder1h(appointment) {
    const config = await this.getConfig();

    if (!config.reminder_1h_enabled) {
      return { sent: false, reason: 'disabled' };
    }

    if (!whatsappService.isConfigured()) {
      return { sent: false, reason: 'whatsapp_not_configured' };
    }

    const phone = appointment.client_phone || appointment.clientPhone;
    const clientName = appointment.client_name || appointment.clientName;
    const serviceName = appointment.service_name || appointment.service;
    const time = this.formatTime(appointment.appointment_time || appointment.time);

    if (!phone) {
      return { sent: false, reason: 'no_phone' };
    }

    try {
      const result = await whatsappService.sendAppointmentReminder1h(
        phone, clientName, serviceName, time
      );

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'reminder_1h',
        `Recordatorio 1h: ${serviceName} - ${time}`,
        result.messageId,
        'sent'
      );

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending 1h reminder:', error);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'reminder_1h',
        null,
        null,
        'failed',
        error.message
      );

      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // Enviar agradecimiento post-servicio
  async sendThankYou(appointment) {
    const config = await this.getConfig();

    if (!config.thankyou_enabled) {
      return { sent: false, reason: 'disabled' };
    }

    if (!whatsappService.isConfigured()) {
      return { sent: false, reason: 'whatsapp_not_configured' };
    }

    const phone = appointment.client_phone || appointment.clientPhone;
    const clientName = appointment.client_name || appointment.clientName;
    const serviceName = appointment.service_name || appointment.service;

    if (!phone) {
      return { sent: false, reason: 'no_phone' };
    }

    try {
      const result = await whatsappService.sendThankYou(phone, clientName, serviceName);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'thankyou',
        `Agradecimiento: ${serviceName}`,
        result.messageId,
        'sent'
      );

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending thank you:', error);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'thankyou',
        null,
        null,
        'failed',
        error.message
      );

      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // Enviar notificacion de cancelacion
  async sendCancellation(appointment) {
    if (!whatsappService.isConfigured()) {
      return { sent: false, reason: 'whatsapp_not_configured' };
    }

    const phone = appointment.client_phone || appointment.clientPhone;
    const clientName = appointment.client_name || appointment.clientName;
    const serviceName = appointment.service_name || appointment.service;
    const date = this.formatDate(appointment.appointment_date || appointment.date);
    const time = this.formatTime(appointment.appointment_time || appointment.time);

    if (!phone) {
      return { sent: false, reason: 'no_phone' };
    }

    const message = `Hola ${clientName},

Tu cita en *Value Skin Studio* ha sido cancelada:

📋 *Servicio:* ${serviceName}
📅 *Fecha:* ${date}
🕐 *Hora:* ${time}

Si deseas reprogramar, contáctanos.

Gracias por tu comprensión. 🌿`;

    try {
      const result = await whatsappService.sendTextMessage(phone, message);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'cancellation',
        message,
        result.messageId,
        'sent'
      );

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending cancellation:', error);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'cancellation',
        null,
        null,
        'failed',
        error.message
      );

      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // Enviar notificacion de reprogramacion
  async sendReschedule(appointment, oldDate, oldTime) {
    if (!whatsappService.isConfigured()) {
      return { sent: false, reason: 'whatsapp_not_configured' };
    }

    const phone = appointment.client_phone || appointment.clientPhone;
    const clientName = appointment.client_name || appointment.clientName;
    const serviceName = appointment.service_name || appointment.service;
    const newDate = this.formatDate(appointment.appointment_date || appointment.date);
    const newTime = this.formatTime(appointment.appointment_time || appointment.time);
    const formattedOldDate = this.formatDate(oldDate);
    const formattedOldTime = this.formatTime(oldTime);

    if (!phone) {
      return { sent: false, reason: 'no_phone' };
    }

    const message = `Hola ${clientName}, 🌿

Tu cita en *Value Skin Studio* ha sido reprogramada:

❌ *Antes:* ${formattedOldDate} a las ${formattedOldTime}
✅ *Ahora:* ${newDate} a las ${newTime}

📋 *Servicio:* ${serviceName}

¡Te esperamos! ✨`;

    try {
      const result = await whatsappService.sendTextMessage(phone, message);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'reschedule',
        message,
        result.messageId,
        'sent'
      );

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending reschedule notification:', error);

      await this.logMessage(
        appointment.id,
        appointment.client_id || appointment.clientId,
        phone,
        'reschedule',
        null,
        null,
        'failed',
        error.message
      );

      return { sent: false, reason: 'error', error: error.message };
    }
  }

  // =====================================================
  // CRON JOBS - Recordatorios Automaticos
  // =====================================================

  // Procesar recordatorios pendientes (llamar desde cron)
  async processReminders() {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping reminders');
      return { processed: 0 };
    }

    const config = await this.getConfig();
    const results = {
      reminder_24h: { sent: 0, failed: 0 },
      reminder_1h: { sent: 0, failed: 0 }
    };

    const now = new Date();
    const timezone = 'America/Argentina/Buenos_Aires';

    // Recordatorios 24h
    if (config.reminder_24h_enabled) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const { data: appointments24h } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('appointment_date', tomorrowDate)
        .in('status', ['pending', 'confirmed']);

      if (appointments24h) {
        for (const apt of appointments24h) {
          // Verificar si ya se envio este recordatorio
          const { data: existing } = await supabaseAdmin
            .from('whatsapp_messages')
            .select('id')
            .eq('appointment_id', apt.id)
            .eq('message_type', 'reminder_24h')
            .eq('status', 'sent')
            .single();

          if (!existing) {
            const result = await this.sendReminder24h(apt);
            if (result.sent) {
              results.reminder_24h.sent++;
            } else {
              results.reminder_24h.failed++;
            }
          }
        }
      }
    }

    // Recordatorios 1h
    if (config.reminder_1h_enabled) {
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const todayDate = now.toISOString().split('T')[0];
      const targetHour = oneHourLater.getHours().toString().padStart(2, '0');
      const targetMinute = oneHourLater.getMinutes().toString().padStart(2, '0');
      const targetTime = `${targetHour}:${targetMinute}`;

      // Buscar citas en la proxima hora (con margen de 10 min)
      const { data: appointments1h } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('appointment_date', todayDate)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_time', targetTime.slice(0, -1) + '0')
        .lte('appointment_time', `${targetHour}:59`);

      if (appointments1h) {
        for (const apt of appointments1h) {
          // Verificar si ya se envio este recordatorio
          const { data: existing } = await supabaseAdmin
            .from('whatsapp_messages')
            .select('id')
            .eq('appointment_id', apt.id)
            .eq('message_type', 'reminder_1h')
            .eq('status', 'sent')
            .single();

          if (!existing) {
            const result = await this.sendReminder1h(apt);
            if (result.sent) {
              results.reminder_1h.sent++;
            } else {
              results.reminder_1h.failed++;
            }
          }
        }
      }
    }

    console.log('Reminders processed:', results);
    return results;
  }

  // Obtener historial de mensajes
  async getMessageHistory(options = {}) {
    const { appointmentId, clientId, limit = 50, page = 1 } = options;

    if (!isSupabaseConfigured()) {
      return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('whatsapp_messages')
      .select('*', { count: 'exact' });

    if (appointmentId) query = query.eq('appointment_id', appointmentId);
    if (clientId) query = query.eq('client_id', clientId);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

module.exports = new NotificationService();
