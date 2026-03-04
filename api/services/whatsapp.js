// WhatsApp Business Cloud API Service - Implementacion Completa
// Documentacion: https://developers.facebook.com/docs/whatsapp/cloud-api
// Node 18+ tiene fetch nativo

const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

class WhatsAppService {
  constructor() {
    this.apiVersion = 'v21.0'; // Version actual de la API
    this.baseUrl = 'https://graph.facebook.com';
  }

  // =====================================================
  // CONFIGURACION
  // =====================================================

  getConfig() {
    return {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'vss-webhook-2024'
    };
  }

  isConfigured() {
    const config = this.getConfig();
    return !!(config.phoneNumberId && config.accessToken);
  }

  // Obtener configuracion desde la BD (para credenciales dinamicas)
  async getConfigFromDB() {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_config')
        .select('*')
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  // =====================================================
  // FORMATEO DE NUMEROS
  // =====================================================

  formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remover espacios, guiones, parentesis y +
    let cleaned = phone.toString().replace(/[\s\-\(\)\+]/g, '');

    // Si el numero argentino tiene 9 despues del 54, removerlo
    // Formato correcto: 54XXXXXXXXXX (sin el 9)
    if (cleaned.startsWith('549') && cleaned.length === 13) {
      cleaned = '54' + cleaned.substring(3);
    }

    // Si no tiene codigo de pais y tiene 10 digitos, agregar 54 (Argentina)
    if (cleaned.length === 10) {
      cleaned = '54' + cleaned;
    }

    return cleaned;
  }

  // =====================================================
  // ENVIO DE MENSAJES
  // =====================================================

  // Enviar mensaje de texto simple
  async sendTextMessage(to, text, previewUrl = false) {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      console.log('WhatsApp not configured, skipping message');
      return { success: false, reason: 'not_configured' };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    if (!formattedNumber) {
      return { success: false, reason: 'invalid_phone' };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: text
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API Error:', data);
        return {
          success: false,
          error: data.error?.message || 'Error enviando mensaje',
          code: data.error?.code
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        data
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar mensaje con template aprobado por Meta
  async sendTemplateMessage(to, templateName, language = 'es', components = []) {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: components
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp Template Error:', data);
        return {
          success: false,
          error: data.error?.message,
          code: data.error?.code
        };
      }

      return { success: true, messageId: data.messages?.[0]?.id, data };
    } catch (error) {
      console.error('WhatsApp template error:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar imagen
  async sendImageMessage(to, imageUrl, caption = '') {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Enviar documento (PDF, etc)
  async sendDocumentMessage(to, documentUrl, filename, caption = '') {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'document',
      document: {
        link: documentUrl,
        filename: filename,
        caption: caption
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Enviar ubicacion
  async sendLocationMessage(to, latitude, longitude, name = '', address = '') {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'location',
      location: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        name: name,
        address: address
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Enviar mensaje interactivo con botones
  async sendButtonMessage(to, bodyText, buttons, headerText = '', footerText = '') {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const interactive = {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((btn, idx) => ({
          type: 'reply',
          reply: {
            id: btn.id || `btn_${idx}`,
            title: btn.title.substring(0, 20) // Max 20 chars
          }
        }))
      }
    };

    if (headerText) {
      interactive.header = { type: 'text', text: headerText };
    }

    if (footerText) {
      interactive.footer = { text: footerText };
    }

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'interactive',
      interactive
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Enviar lista interactiva
  async sendListMessage(to, bodyText, buttonText, sections, headerText = '', footerText = '') {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const interactive = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText.substring(0, 20),
        sections: sections.map(section => ({
          title: section.title,
          rows: section.rows.map(row => ({
            id: row.id,
            title: row.title.substring(0, 24),
            description: row.description?.substring(0, 72) || ''
          }))
        }))
      }
    };

    if (headerText) {
      interactive.header = { type: 'text', text: headerText };
    }

    if (footerText) {
      interactive.footer = { text: footerText };
    }

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'interactive',
      interactive
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Marcar mensaje como leido
  async markAsRead(messageId) {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // NOTIFICACIONES DE CITAS (Mensajes predefinidos)
  // =====================================================

  async sendAppointmentConfirmation(phone, clientName, serviceName, date, time) {
    const message = `Hola ${clientName},

Tu cita en *Value Skin Studio* ha sido confirmada:

*Servicio:* ${serviceName}
*Fecha:* ${date}
*Hora:* ${time}

Te esperamos en nuestra ubicacion.

Si necesitas cancelar o reprogramar, contactanos con anticipacion.

Gracias por elegirnos!`;

    return this.sendTextMessage(phone, message);
  }

  async sendAppointmentReminder24h(phone, clientName, serviceName, date, time) {
    const message = `Hola ${clientName},

Te recordamos que tienes una cita *manana* en Value Skin Studio:

*Servicio:* ${serviceName}
*Fecha:* ${date}
*Hora:* ${time}

Podras asistir? Responde para confirmar o llamanos para reprogramar.

Te esperamos!`;

    return this.sendTextMessage(phone, message);
  }

  async sendAppointmentReminder1h(phone, clientName, serviceName, time) {
    const message = `Hola ${clientName},

Tu cita en Value Skin Studio es en *1 hora* (${time}).

Te esperamos!`;

    return this.sendTextMessage(phone, message);
  }

  async sendThankYou(phone, clientName, serviceName) {
    const message = `Hola ${clientName},

Gracias por visitarnos hoy en *Value Skin Studio*.

Esperamos que hayas disfrutado tu ${serviceName}. Tu bienestar es nuestra prioridad.

Nos encantaria conocer tu opinion.
Quieres agendar tu proxima cita?

Hasta pronto!`;

    return this.sendTextMessage(phone, message);
  }

  async sendCancellationNotification(phone, clientName, serviceName, date, time) {
    const message = `Hola ${clientName},

Tu cita en Value Skin Studio ha sido cancelada:

*Servicio:* ${serviceName}
*Fecha:* ${date}
*Hora:* ${time}

Si deseas reprogramar, contactanos.

Gracias por tu comprension.`;

    return this.sendTextMessage(phone, message);
  }

  async sendRescheduleNotification(phone, clientName, serviceName, oldDate, oldTime, newDate, newTime) {
    const message = `Hola ${clientName},

Tu cita en *Value Skin Studio* ha sido reprogramada:

*Antes:* ${oldDate} a las ${oldTime}
*Ahora:* ${newDate} a las ${newTime}

*Servicio:* ${serviceName}

Te esperamos!`;

    return this.sendTextMessage(phone, message);
  }

  // =====================================================
  // WEBHOOK
  // =====================================================

  // Verificar webhook de Meta
  verifyWebhook(mode, token, challenge) {
    const config = this.getConfig();

    if (mode === 'subscribe' && token === config.webhookVerifyToken) {
      console.log('Webhook verified successfully');
      return challenge;
    }

    console.log('Webhook verification failed');
    return null;
  }

  // Procesar mensaje entrante del webhook
  async processWebhookMessage(body) {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) return null;

      // Extraer informacion del mensaje
      const messages = value.messages;
      const contacts = value.contacts;
      const statuses = value.statuses;

      // Procesar actualizaciones de estado (enviado, entregado, leido)
      if (statuses && statuses.length > 0) {
        for (const status of statuses) {
          await this.handleStatusUpdate(status);
        }
      }

      // Procesar mensajes entrantes
      if (messages && messages.length > 0) {
        const contact = contacts?.[0];

        for (const message of messages) {
          await this.handleIncomingMessage(message, contact);
        }
      }

      return { processed: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return { processed: false, error: error.message };
    }
  }

  // Manejar actualizacion de estado de mensaje
  async handleStatusUpdate(status) {
    const { id, status: messageStatus, timestamp, recipient_id, errors } = status;

    console.log(`Message ${id} status: ${messageStatus}`);

    // Guardar en BD si esta configurada
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin
          .from('whatsapp_messages')
          .update({
            status: messageStatus,
            delivered_at: messageStatus === 'delivered' ? new Date().toISOString() : null,
            read_at: messageStatus === 'read' ? new Date().toISOString() : null,
            error_message: errors?.[0]?.message || null
          })
          .eq('whatsapp_message_id', id);
      } catch (err) {
        console.error('Error updating message status:', err);
      }
    }

    return { messageId: id, status: messageStatus };
  }

  // Manejar mensaje entrante
  async handleIncomingMessage(message, contact) {
    const { id, from, timestamp, type } = message;
    const contactName = contact?.profile?.name || 'Unknown';

    let content = '';
    let mediaUrl = null;

    switch (type) {
      case 'text':
        content = message.text?.body || '';
        break;
      case 'image':
        content = message.image?.caption || '[Imagen]';
        mediaUrl = message.image?.id;
        break;
      case 'document':
        content = message.document?.filename || '[Documento]';
        mediaUrl = message.document?.id;
        break;
      case 'audio':
        content = '[Audio]';
        mediaUrl = message.audio?.id;
        break;
      case 'video':
        content = message.video?.caption || '[Video]';
        mediaUrl = message.video?.id;
        break;
      case 'location':
        content = `[Ubicacion: ${message.location?.latitude}, ${message.location?.longitude}]`;
        break;
      case 'button':
        content = message.button?.text || '[Boton]';
        break;
      case 'interactive':
        content = message.interactive?.button_reply?.title ||
                  message.interactive?.list_reply?.title ||
                  '[Interactivo]';
        break;
      default:
        content = `[${type}]`;
    }

    console.log(`Incoming message from ${from} (${contactName}): ${content}`);

    // Guardar en BD si esta configurada
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin
          .from('whatsapp_incoming')
          .insert({
            whatsapp_message_id: id,
            from_phone: from,
            from_name: contactName,
            message_type: type,
            content: content,
            media_id: mediaUrl,
            received_at: new Date(parseInt(timestamp) * 1000).toISOString()
          });
      } catch (err) {
        console.error('Error saving incoming message:', err);
      }
    }

    // Marcar como leido automaticamente
    await this.markAsRead(id);

    return {
      messageId: id,
      from,
      contactName,
      type,
      content
    };
  }

  // =====================================================
  // GESTION DE TEMPLATES
  // =====================================================

  // Obtener templates aprobados
  async getMessageTemplates() {
    const config = this.getConfig();

    if (!config.businessAccountId || !config.accessToken) {
      return { success: false, error: 'Business Account ID not configured' };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${config.businessAccountId}/message_templates`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, templates: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // INFORMACION DEL NUMERO
  // =====================================================

  // Obtener informacion del numero de telefono
  async getPhoneNumberInfo() {
    const config = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, reason: 'not_configured' };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${config.phoneNumberId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,messaging_limit_tier`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, info: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Obtener estado de la cuenta business
  async getBusinessAccountInfo() {
    const config = this.getConfig();

    if (!config.businessAccountId || !config.accessToken) {
      return { success: false, error: 'Business Account ID not configured' };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${config.businessAccountId}?fields=name,timezone_id,message_template_namespace`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message };
      }

      return { success: true, info: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
