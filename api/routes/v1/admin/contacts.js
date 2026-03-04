// Rutas admin de contactos
const express = require('express');
const router = express.Router();
const Contact = require('../../../models/Contact');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { asyncHandler, createError } = require('../../../middleware/errorHandler');

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/v1/admin/contacts - Obtener todos los contactos
router.get('/', isEditor, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const result = await Contact.getAll({ page: parseInt(page), limit: parseInt(limit), status });

  // Extraer el array de datos (el modelo retorna {data, pagination})
  let contacts = Array.isArray(result) ? result : (result?.data || []);
  const pagination = result?.pagination || { page: parseInt(page), limit: parseInt(limit), total: contacts.length, totalPages: 1 };

  // Ordenar por fecha descendente
  contacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    success: true,
    count: contacts.length,
    total: pagination.total,
    page: pagination.page,
    totalPages: pagination.totalPages,
    data: contacts
  });
}));

// GET /api/v1/admin/contacts/pending - Obtener contactos pendientes
router.get('/pending', isEditor, asyncHandler(async (req, res) => {
  const contacts = await Contact.getByStatus('pending');

  res.json({
    success: true,
    count: contacts.length,
    data: contacts
  });
}));

// GET /api/v1/admin/contacts/stats - Obtener estadisticas
router.get('/stats', isEditor, asyncHandler(async (req, res) => {
  const stats = await Contact.getStats();

  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/v1/admin/contacts/export - Exportar contactos
router.get('/export', isAdmin, asyncHandler(async (req, res) => {
  const { status, format = 'json' } = req.query;

  const result = await Contact.getAll({ limit: 10000, status });
  let contacts = Array.isArray(result) ? result : (result?.data || []);

  if (format === 'csv') {
    if (contacts.length === 0) {
      return res.status(200).send('');
    }

    const headers = ['id', 'name', 'email', 'phone', 'subject', 'message', 'status', 'created_at'];
    const csvRows = [headers.join(',')];

    contacts.forEach(contact => {
      const values = headers.map(h => {
        const val = contact[h];
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contactos.csv');
    return res.send(csvRows.join('\n'));
  }

  res.json({
    success: true,
    count: contacts.length,
    data: contacts
  });
}));

// GET /api/v1/admin/contacts/:id - Obtener contacto por ID
router.get('/:id', isEditor, asyncHandler(async (req, res) => {
  const contact = await Contact.getById(req.params.id);

  if (!contact) {
    throw createError.notFound('Contacto no encontrado');
  }

  res.json({
    success: true,
    data: contact
  });
}));

// PUT /api/v1/admin/contacts/:id/status - Actualizar estado
router.put('/:id/status', isAdmin, asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['pending', 'contacted', 'resolved', 'spam'];

  if (status && !validStatuses.includes(status)) {
    throw createError.badRequest(`Estado invalido. Debe ser: ${validStatuses.join(', ')}`);
  }

  const contact = await Contact.updateStatus(req.params.id, status, notes);

  if (!contact) {
    throw createError.notFound('Contacto no encontrado');
  }

  res.json({
    success: true,
    message: 'Estado actualizado',
    data: contact
  });
}));

// PATCH /api/v1/admin/contacts/:id/read - Marcar como leido
router.patch('/:id/read', isEditor, asyncHandler(async (req, res) => {
  const contact = await Contact.markAsRead(req.params.id);

  if (!contact) {
    throw createError.notFound('Contacto no encontrado');
  }

  res.json({
    success: true,
    message: 'Marcado como leido',
    data: contact
  });
}));

// DELETE /api/v1/admin/contacts/:id - Eliminar contacto
router.delete('/:id', isAdmin, asyncHandler(async (req, res) => {
  const contact = await Contact.getById(req.params.id);

  if (!contact) {
    throw createError.notFound('Contacto no encontrado');
  }

  await Contact.delete(req.params.id);

  res.json({
    success: true,
    message: 'Contacto eliminado'
  });
}));

// DELETE /api/v1/admin/contacts - Eliminar multiples contactos
router.delete('/', isAdmin, asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    throw createError.badRequest('Se requiere un array de IDs');
  }

  let deleted = 0;
  for (const id of ids) {
    const result = await Contact.delete(id);
    if (result) deleted++;
  }

  res.json({
    success: true,
    message: `${deleted} contactos eliminados`
  });
}));

module.exports = router;
