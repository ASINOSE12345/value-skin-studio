// Utilidad para envio de emails
const nodemailer = require('nodemailer');

// Configurar transporter
let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;

  // Verificar configuracion
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('Email no configurado. Variables SMTP_* requeridas.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

// Verificar conexion
const verifyConnection = async () => {
  const t = initTransporter();
  if (!t) return false;

  try {
    await t.verify();
    return true;
  } catch (error) {
    console.error('Error verificando conexion SMTP:', error);
    return false;
  }
};

// Enviar email generico
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  const t = initTransporter();
  if (!t) {
    console.warn('No se puede enviar email: transporter no configurado');
    return { success: false, message: 'Email no configurado' };
  }

  try {
    const info = await t.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Value Skin Studio'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, message: error.message };
  }
};

// Plantilla base HTML
const baseTemplate = (content, title = 'Value Skin Studio') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1a1a2e; padding: 30px; text-align: center; }
    .header img { max-height: 60px; }
    .header h1 { color: #d4af37; margin: 10px 0 0 0; font-size: 24px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .button { display: inline-block; background-color: #d4af37; color: #1a1a2e; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .button:hover { background-color: #c4a030; }
    .footer { background-color: #1a1a2e; padding: 20px; text-align: center; color: #888888; font-size: 12px; }
    .footer a { color: #d4af37; text-decoration: none; }
    .info-box { background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Value Skin Studio</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Value Skin Studio. Todos los derechos reservados.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || '#'}">Visitar sitio web</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Email de confirmacion de contacto
const sendContactConfirmation = async (contact) => {
  const content = `
    <h2>Hemos recibido tu mensaje</h2>
    <p>Hola <strong>${contact.name}</strong>,</p>
    <p>Gracias por contactarnos. Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.</p>
    <div class="info-box">
      <p><strong>Tu mensaje:</strong></p>
      <p>${contact.message}</p>
    </div>
    <p>Si tienes alguna pregunta urgente, puedes contactarnos directamente:</p>
    <ul>
      <li>Telefono: ${process.env.CONTACT_PHONE || '(55) 1234-5678'}</li>
      <li>WhatsApp: ${process.env.CONTACT_WHATSAPP || '(55) 1234-5678'}</li>
    </ul>
    <p>Saludos cordiales,<br>El equipo de Value Skin Studio</p>
  `;

  return sendEmail({
    to: contact.email,
    subject: 'Hemos recibido tu mensaje - Value Skin Studio',
    html: baseTemplate(content, 'Confirmacion de Contacto')
  });
};

// Email de notificacion de nuevo contacto (admin)
const sendContactNotification = async (contact) => {
  const content = `
    <h2>Nueva solicitud de contacto</h2>
    <div class="info-box">
      <p><strong>Nombre:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Telefono:</strong> ${contact.phone || 'No proporcionado'}</p>
      <p><strong>Asunto:</strong> ${contact.subject || 'Sin asunto'}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${contact.message}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
    </div>
    <a href="${process.env.FRONTEND_URL || '#'}/admin" class="button">Ver en el panel</a>
  `;

  return sendEmail({
    to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
    subject: `Nueva consulta de ${contact.name} - Value Skin Studio`,
    html: baseTemplate(content, 'Nueva Consulta')
  });
};

// Email de confirmacion de cita
const sendAppointmentConfirmation = async (appointment) => {
  const content = `
    <h2>Confirmacion de Cita</h2>
    <p>Hola <strong>${appointment.client_name || appointment.name}</strong>,</p>
    <p>Tu cita ha sido programada exitosamente.</p>
    <div class="info-box">
      <p><strong>Servicio:</strong> ${appointment.service}</p>
      <p><strong>Fecha:</strong> ${appointment.date}</p>
      <p><strong>Hora:</strong> ${appointment.time}</p>
      ${appointment.duration ? `<p><strong>Duracion:</strong> ${appointment.duration} minutos</p>` : ''}
    </div>
    <p>Por favor llega 10 minutos antes de tu cita. Si necesitas cancelar o reprogramar, contactanos con al menos 24 horas de anticipacion.</p>
    <p>Te esperamos,<br>El equipo de Value Skin Studio</p>
  `;

  const email = appointment.client_email || appointment.email;
  if (!email) return { success: false, message: 'No hay email de cliente' };

  return sendEmail({
    to: email,
    subject: 'Confirmacion de Cita - Value Skin Studio',
    html: baseTemplate(content, 'Confirmacion de Cita')
  });
};

// Email de notificacion de nueva cita (admin)
const sendAppointmentNotification = async (appointment) => {
  const content = `
    <h2>Nueva cita programada</h2>
    <div class="info-box">
      <p><strong>Cliente:</strong> ${appointment.client_name || appointment.name}</p>
      <p><strong>Email:</strong> ${appointment.client_email || appointment.email}</p>
      <p><strong>Telefono:</strong> ${appointment.client_phone || appointment.phone || 'No proporcionado'}</p>
      <p><strong>Servicio:</strong> ${appointment.service}</p>
      <p><strong>Fecha:</strong> ${appointment.date}</p>
      <p><strong>Hora:</strong> ${appointment.time}</p>
      ${appointment.notes ? `<p><strong>Notas:</strong> ${appointment.notes}</p>` : ''}
    </div>
    <a href="${process.env.FRONTEND_URL || '#'}/admin" class="button">Ver en el panel</a>
  `;

  return sendEmail({
    to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
    subject: `Nueva cita: ${appointment.client_name || appointment.name} - ${appointment.date}`,
    html: baseTemplate(content, 'Nueva Cita')
  });
};

// Email de recordatorio de cita
const sendAppointmentReminder = async (appointment) => {
  const content = `
    <h2>Recordatorio de Cita</h2>
    <p>Hola <strong>${appointment.client_name || appointment.name}</strong>,</p>
    <p>Te recordamos que tienes una cita programada.</p>
    <div class="info-box">
      <p><strong>Servicio:</strong> ${appointment.service}</p>
      <p><strong>Fecha:</strong> ${appointment.date}</p>
      <p><strong>Hora:</strong> ${appointment.time}</p>
    </div>
    <p>Por favor llega 10 minutos antes. Si no puedes asistir, contactanos lo antes posible.</p>
    <p>Te esperamos,<br>El equipo de Value Skin Studio</p>
  `;

  const email = appointment.client_email || appointment.email;
  if (!email) return { success: false, message: 'No hay email de cliente' };

  return sendEmail({
    to: email,
    subject: 'Recordatorio de Cita - Value Skin Studio',
    html: baseTemplate(content, 'Recordatorio de Cita')
  });
};

// Email de reset de password
const sendPasswordReset = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const content = `
    <h2>Restablecer Contrasena</h2>
    <p>Hola <strong>${user.name}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contrasena.</p>
    <p>Haz clic en el siguiente boton para crear una nueva contrasena:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Restablecer Contrasena</a>
    </p>
    <p>Este enlace expirara en 1 hora.</p>
    <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contrasena permanecera igual.</p>
    <p>Saludos,<br>El equipo de Value Skin Studio</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Restablecer Contrasena - Value Skin Studio',
    html: baseTemplate(content, 'Restablecer Contrasena')
  });
};

// Email de bienvenida
const sendWelcome = async (user) => {
  const content = `
    <h2>Bienvenido a Value Skin Studio</h2>
    <p>Hola <strong>${user.name}</strong>,</p>
    <p>Tu cuenta ha sido creada exitosamente.</p>
    <p>Ahora puedes acceder al panel de administracion para gestionar el sitio.</p>
    <p style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" class="button">Ir al Panel</a>
    </p>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    <p>Saludos,<br>El equipo de Value Skin Studio</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Bienvenido a Value Skin Studio',
    html: baseTemplate(content, 'Bienvenido')
  });
};

module.exports = {
  initTransporter,
  verifyConnection,
  sendEmail,
  sendContactConfirmation,
  sendContactNotification,
  sendAppointmentConfirmation,
  sendAppointmentNotification,
  sendAppointmentReminder,
  sendPasswordReset,
  sendWelcome
};
