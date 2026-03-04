// Rutas admin de citas/turnos
const express = require('express');
const router = express.Router();
const Appointment = require('../../../models/Appointment');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { asyncHandler, createError } = require('../../../middleware/errorHandler');
const { validateAppointment } = require('../../../middleware/validate');
const notificationService = require('../../../services/notificationService');

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/v1/admin/appointments - Obtener todas las citas
router.get('/', isEditor, asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 20 } = req.query;

  const result = await Appointment.getAll({ page: parseInt(page), limit: parseInt(limit), status, date });

  // Extraer el array de datos (el modelo retorna {data, pagination})
  let appointments = Array.isArray(result) ? result : (result?.data || []);
  const pagination = result?.pagination || { page: parseInt(page), limit: parseInt(limit), total: appointments.length, totalPages: 1 };

  // Ordenar por fecha descendente
  appointments.sort((a, b) => {
    const dateA = new Date(`${a.date || a.appointment_date} ${a.time || a.appointment_time}`);
    const dateB = new Date(`${b.date || b.appointment_date} ${b.time || b.appointment_time}`);
    return dateB - dateA;
  });

  res.json({
    success: true,
    count: appointments.length,
    total: pagination.total,
    page: pagination.page,
    totalPages: pagination.totalPages,
    data: appointments
  });
}));

// GET /api/v1/admin/appointments/upcoming - Obtener citas proximas
router.get('/upcoming', isEditor, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const appointments = await Appointment.getUpcoming(parseInt(limit));

  res.json({
    success: true,
    count: appointments.length,
    data: appointments
  });
}));

// GET /api/v1/admin/appointments/today - Obtener citas de hoy
router.get('/today', isEditor, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const appointments = await Appointment.getByDate(today);

  res.json({
    success: true,
    count: appointments.length,
    data: appointments
  });
}));

// GET /api/v1/admin/appointments/stats - Obtener estadisticas
router.get('/stats', isEditor, asyncHandler(async (req, res) => {
  const stats = await Appointment.getStats();

  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/v1/admin/appointments/availability - Verificar disponibilidad
router.get('/availability', isEditor, asyncHandler(async (req, res) => {
  const { date, time, duration = 60, excludeId } = req.query;

  if (!date || !time) {
    throw createError.badRequest('Se requiere fecha y hora');
  }

  const isAvailable = await Appointment.checkAvailability(date, time, parseInt(duration), excludeId);

  res.json({
    success: true,
    data: {
      date,
      time,
      available: isAvailable
    }
  });
}));

// GET /api/v1/admin/appointments/date/:date - Obtener citas por fecha
router.get('/date/:date', isEditor, asyncHandler(async (req, res) => {
  const appointments = await Appointment.getByDate(req.params.date);

  res.json({
    success: true,
    count: appointments.length,
    data: appointments
  });
}));

// GET /api/v1/admin/appointments/:id - Obtener cita por ID
router.get('/:id', isEditor, asyncHandler(async (req, res) => {
  const appointment = await Appointment.getById(req.params.id);

  if (!appointment) {
    throw createError.notFound('Cita no encontrada');
  }

  res.json({
    success: true,
    data: appointment
  });
}));

// POST /api/v1/admin/appointments - Crear cita
router.post('/', isAdmin, validateAppointment, asyncHandler(async (req, res) => {
  const appointmentData = {
    clientName: req.body.clientName || req.body.name,
    clientEmail: req.body.clientEmail || req.body.email,
    clientPhone: req.body.clientPhone || req.body.phone,
    service: req.body.service,
    date: req.body.date,
    time: req.body.time,
    duration: req.body.duration,
    notes: req.body.notes,
    clientId: req.body.clientId
  };

  // Verificar disponibilidad
  const isAvailable = await Appointment.checkAvailability(
    appointmentData.date,
    appointmentData.time,
    appointmentData.duration || 60
  );

  if (!isAvailable) {
    throw createError.conflict('El horario seleccionado no esta disponible');
  }

  const appointment = await Appointment.create(appointmentData);

  // Enviar notificacion de confirmacion por WhatsApp (async, no bloquea)
  notificationService.sendAppointmentConfirmation(appointment)
    .then(result => {
      if (result.sent) {
        console.log('WhatsApp confirmation sent for appointment:', appointment.id);
      }
    })
    .catch(err => console.error('Error sending WhatsApp confirmation:', err));

  res.status(201).json({
    success: true,
    message: 'Cita creada correctamente',
    data: appointment
  });
}));

// PUT /api/v1/admin/appointments/:id - Actualizar cita
router.put('/:id', isAdmin, asyncHandler(async (req, res) => {
  const existing = await Appointment.getById(req.params.id);

  if (!existing) {
    throw createError.notFound('Cita no encontrada');
  }

  // Guardar fecha/hora anterior para notificar reprogramacion
  const oldDate = existing.appointment_date || existing.date;
  const oldTime = existing.appointment_time || existing.time;
  const dateChanged = req.body.date && req.body.date !== oldDate;
  const timeChanged = req.body.time && req.body.time !== oldTime;

  // Si cambia fecha/hora, verificar disponibilidad
  if (req.body.date || req.body.time) {
    const date = req.body.date || existing.date;
    const time = req.body.time || existing.time;
    const duration = req.body.duration || existing.duration || 60;

    const isAvailable = await Appointment.checkAvailability(date, time, duration, req.params.id);

    if (!isAvailable) {
      throw createError.conflict('El horario seleccionado no esta disponible');
    }
  }

  const appointment = await Appointment.update(req.params.id, req.body);

  // Si cambio fecha u hora, notificar reprogramacion
  if (dateChanged || timeChanged) {
    notificationService.sendReschedule(appointment, oldDate, oldTime)
      .then(result => {
        if (result.sent) {
          console.log('WhatsApp reschedule notification sent for appointment:', appointment.id);
        }
      })
      .catch(err => console.error('Error sending reschedule notification:', err));
  }

  res.json({
    success: true,
    message: 'Cita actualizada',
    data: appointment
  });
}));

// PUT /api/v1/admin/appointments/:id/status - Actualizar estado
router.put('/:id/status', isAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

  if (!validStatuses.includes(status)) {
    throw createError.badRequest(`Estado invalido. Debe ser: ${validStatuses.join(', ')}`);
  }

  const appointment = await Appointment.update(req.params.id, { status });

  if (!appointment) {
    throw createError.notFound('Cita no encontrada');
  }

  res.json({
    success: true,
    message: 'Estado actualizado',
    data: appointment
  });
}));

// PATCH /api/v1/admin/appointments/:id/confirm - Confirmar cita
router.patch('/:id/confirm', isAdmin, asyncHandler(async (req, res) => {
  const appointment = await Appointment.confirm(req.params.id);

  if (!appointment) {
    throw createError.notFound('Cita no encontrada');
  }

  // Enviar confirmacion por WhatsApp
  notificationService.sendAppointmentConfirmation(appointment)
    .then(result => {
      if (result.sent) {
        console.log('WhatsApp confirmation sent for appointment:', appointment.id);
      }
    })
    .catch(err => console.error('Error sending confirmation:', err));

  res.json({
    success: true,
    message: 'Cita confirmada',
    data: appointment
  });
}));

// PATCH /api/v1/admin/appointments/:id/cancel - Cancelar cita
router.patch('/:id/cancel', isAdmin, asyncHandler(async (req, res) => {
  // Obtener datos antes de cancelar para la notificacion
  const existingAppointment = await Appointment.getById(req.params.id);

  const appointment = await Appointment.cancel(req.params.id);

  if (!appointment) {
    throw createError.notFound('Cita no encontrada');
  }

  // Enviar notificacion de cancelacion por WhatsApp
  notificationService.sendCancellation(existingAppointment)
    .then(result => {
      if (result.sent) {
        console.log('WhatsApp cancellation sent for appointment:', appointment.id);
      }
    })
    .catch(err => console.error('Error sending cancellation:', err));

  res.json({
    success: true,
    message: 'Cita cancelada',
    data: appointment
  });
}));

// PATCH /api/v1/admin/appointments/:id/complete - Completar cita
router.patch('/:id/complete', isAdmin, asyncHandler(async (req, res) => {
  const appointment = await Appointment.complete(req.params.id);

  if (!appointment) {
    throw createError.notFound('Cita no encontrada');
  }

  // Enviar agradecimiento por WhatsApp
  notificationService.sendThankYou(appointment)
    .then(result => {
      if (result.sent) {
        console.log('WhatsApp thank you sent for appointment:', appointment.id);
      }
    })
    .catch(err => console.error('Error sending thank you:', err));

  res.json({
    success: true,
    message: 'Cita completada',
    data: appointment
  });
}));

// DELETE /api/v1/admin/appointments/:id - Eliminar cita
router.delete('/:id', isAdmin, asyncHandler(async (req, res) => {
  const appointment = await Appointment.getById(req.params.id);

  if (!appointment) {
    throw createError.notFound('Cita no encontrada');
  }

  await Appointment.delete(req.params.id);

  res.json({
    success: true,
    message: 'Cita eliminada'
  });
}));

module.exports = router;
