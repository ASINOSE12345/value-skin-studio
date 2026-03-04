// Controlador de Contacto
const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Configurar transporter de email (usar variables de entorno en producción)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.create = async (req, res) => {
  try {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Crear contacto
    const contact = Contact.create(req.body);

    // Enviar email de notificación (opcional)
    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
          subject: `Nueva consulta de ${contact.name} - ${contact.type}`,
          html: `
            <h2>Nueva Consulta en Value Skin Studio</h2>
            <p><strong>Nombre:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Teléfono:</strong> ${contact.phone}</p>
            <p><strong>Tipo:</strong> ${contact.type}</p>
            <p><strong>Mensaje:</strong> ${contact.message}</p>
            <p><strong>Fecha:</strong> ${contact.createdAt.toLocaleString()}</p>
          `
        });
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
      }
    }

    res.status(201).json({ 
      success: true, 
      message: 'Mensaje enviado exitosamente. Te contactaremos pronto.',
      data: contact 
    });
  } catch (error) {
    console.error('Error creando contacto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al enviar el mensaje' 
    });
  }
};

exports.getAll = (req, res) => {
  try {
    const contacts = Contact.getAll();
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo contactos' });
  }
};

exports.getById = (req, res) => {
  try {
    const contact = Contact.getById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo contacto' });
  }
};

exports.update = (req, res) => {
  try {
    const contact = Contact.update(req.params.id, req.body);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }
    res.json({ success: true, message: 'Contacto actualizado', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error actualizando contacto' });
  }
};

exports.delete = (req, res) => {
  try {
    const deleted = Contact.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }
    res.json({ success: true, message: 'Contacto eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error eliminando contacto' });
  }
};

module.exports = exports;
