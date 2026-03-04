// Rutas admin de disponibilidad/horarios
const express = require('express');
const router = express.Router();
const Availability = require('../../../models/Availability');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { asyncHandler, createError } = require('../../../middleware/errorHandler');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/v1/admin/availability - Obtener todos los horarios
router.get('/', isEditor, asyncHandler(async (req, res) => {
  const availability = await Availability.getAll();

  res.json({
    success: true,
    data: availability
  });
}));

// GET /api/v1/admin/availability/slots/:date - Obtener slots disponibles para una fecha
router.get('/slots/:date', isEditor, asyncHandler(async (req, res) => {
  const { duration = 60 } = req.query;
  const slots = await Availability.getAvailableSlots(req.params.date, parseInt(duration));

  res.json({
    success: true,
    date: req.params.date,
    duration: parseInt(duration),
    data: slots
  });
}));

// GET /api/v1/admin/availability/check - Verificar disponibilidad
router.get('/check', isEditor, asyncHandler(async (req, res) => {
  const { date, time } = req.query;

  if (!date || !time) {
    throw createError.badRequest('Se requiere fecha y hora');
  }

  const available = await Availability.isTimeAvailable(date, time);

  res.json({
    success: true,
    data: {
      date,
      time,
      available
    }
  });
}));

// GET /api/v1/admin/availability/:day - Obtener horario de un día
router.get('/:day', isEditor, asyncHandler(async (req, res) => {
  const dayOfWeek = parseInt(req.params.day);

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw createError.badRequest('Día inválido (0-6)');
  }

  const availability = await Availability.getByDay(dayOfWeek);

  res.json({
    success: true,
    data: availability
  });
}));

// PUT /api/v1/admin/availability/:day - Actualizar horario de un día
router.put('/:day', isAdmin, asyncHandler(async (req, res) => {
  const dayOfWeek = parseInt(req.params.day);

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw createError.badRequest('Día inválido (0-6)');
  }

  const { startTime, endTime, isAvailable } = req.body;

  const updated = await Availability.update(dayOfWeek, {
    startTime,
    endTime,
    isAvailable
  });

  res.json({
    success: true,
    message: 'Horario actualizado',
    data: updated
  });
}));

// PUT /api/v1/admin/availability - Actualizar todos los horarios
router.put('/', isAdmin, asyncHandler(async (req, res) => {
  const { schedule } = req.body;

  if (!schedule || !Array.isArray(schedule)) {
    throw createError.badRequest('Se requiere un array de horarios');
  }

  const results = [];
  for (const day of schedule) {
    const updated = await Availability.update(day.dayOfWeek || day.day_of_week, {
      startTime: day.startTime || day.start_time,
      endTime: day.endTime || day.end_time,
      isAvailable: day.isAvailable ?? day.is_available
    });
    results.push(updated);
  }

  res.json({
    success: true,
    message: 'Horarios actualizados',
    data: results
  });
}));

// =====================================================
// BLOQUEOS DE HORARIO
// =====================================================

// GET /api/v1/admin/availability/blocks - Obtener bloqueos
router.get('/blocks/list', isEditor, asyncHandler(async (req, res) => {
  const blocks = await Availability.getBlockedTimes();

  res.json({
    success: true,
    count: blocks.length,
    data: blocks
  });
}));

// POST /api/v1/admin/availability/blocks - Crear bloqueo
router.post('/blocks', isAdmin, asyncHandler(async (req, res) => {
  const { startDatetime, endDatetime, reason } = req.body;

  if (!startDatetime || !endDatetime) {
    throw createError.badRequest('Se requiere fecha/hora de inicio y fin');
  }

  const block = await Availability.createBlock({
    startDatetime,
    endDatetime,
    reason
  });

  res.status(201).json({
    success: true,
    message: 'Bloqueo creado',
    data: block
  });
}));

// DELETE /api/v1/admin/availability/blocks/:id - Eliminar bloqueo
router.delete('/blocks/:id', isAdmin, asyncHandler(async (req, res) => {
  const deleted = await Availability.deleteBlock(req.params.id);

  if (!deleted) {
    throw createError.notFound('Bloqueo no encontrado');
  }

  res.json({
    success: true,
    message: 'Bloqueo eliminado'
  });
}));

module.exports = router;
