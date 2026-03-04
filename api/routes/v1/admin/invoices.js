// Rutas admin de facturas/recibos
const express = require('express');
const router = express.Router();
const Invoice = require('../../../models/Invoice');
const Client = require('../../../models/Client');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { asyncHandler, createError } = require('../../../middleware/errorHandler');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/v1/admin/invoices - Obtener todas las facturas
router.get('/', isEditor, asyncHandler(async (req, res) => {
  const { status, type, clientId, page = 1, limit = 20 } = req.query;

  const result = await Invoice.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    type,
    clientId
  });

  res.json({
    success: true,
    ...result
  });
}));

// GET /api/v1/admin/invoices/stats - Estadísticas de facturación
router.get('/stats', isEditor, asyncHandler(async (req, res) => {
  const stats = await Invoice.getStats();

  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/v1/admin/invoices/:id - Obtener factura por ID
router.get('/:id', isEditor, asyncHandler(async (req, res) => {
  const invoice = await Invoice.getById(req.params.id);

  if (!invoice) {
    throw createError.notFound('Factura no encontrada');
  }

  res.json({
    success: true,
    data: invoice
  });
}));

// POST /api/v1/admin/invoices - Crear factura
router.post('/', isAdmin, asyncHandler(async (req, res) => {
  const {
    clientId,
    appointmentId,
    type = 'receipt',
    items,
    notes,
    discountAmount = 0,
    taxRate = 0
  } = req.body;

  if (!clientId) {
    throw createError.badRequest('El cliente es requerido');
  }

  if (!items || items.length === 0) {
    throw createError.badRequest('Se requiere al menos un item');
  }

  // Calcular totales
  let subtotal = 0;
  const processedItems = items.map(item => {
    const itemTotal = (item.quantity || 1) * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
    subtotal += itemTotal;
    return {
      ...item,
      total: itemTotal
    };
  });

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;

  const invoice = await Invoice.create({
    clientId,
    appointmentId,
    type,
    items: processedItems,
    notes,
    subtotal,
    discountAmount,
    taxRate,
    taxAmount,
    total,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Factura creada correctamente',
    data: invoice
  });
}));

// PUT /api/v1/admin/invoices/:id - Actualizar factura
router.put('/:id', isAdmin, asyncHandler(async (req, res) => {
  const invoice = await Invoice.getById(req.params.id);

  if (!invoice) {
    throw createError.notFound('Factura no encontrada');
  }

  if (invoice.status === 'paid') {
    throw createError.badRequest('No se puede modificar una factura pagada');
  }

  const updated = await Invoice.update(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Factura actualizada',
    data: updated
  });
}));

// PUT /api/v1/admin/invoices/:id/pay - Marcar como pagada
router.put('/:id/pay', isAdmin, asyncHandler(async (req, res) => {
  const { paymentMethod } = req.body;

  const invoice = await Invoice.getById(req.params.id);

  if (!invoice) {
    throw createError.notFound('Factura no encontrada');
  }

  if (invoice.status === 'paid') {
    throw createError.badRequest('La factura ya está pagada');
  }

  const updated = await Invoice.markAsPaid(req.params.id, paymentMethod);

  res.json({
    success: true,
    message: 'Factura marcada como pagada',
    data: updated
  });
}));

// PUT /api/v1/admin/invoices/:id/send - Enviar factura
router.put('/:id/send', isAdmin, asyncHandler(async (req, res) => {
  const { channel = 'email' } = req.body; // email, whatsapp

  const invoice = await Invoice.getById(req.params.id);

  if (!invoice) {
    throw createError.notFound('Factura no encontrada');
  }

  // Actualizar estado a enviada
  await Invoice.update(req.params.id, { status: 'sent' });

  // TODO: Implementar envío real por email/WhatsApp

  res.json({
    success: true,
    message: `Factura enviada por ${channel}`,
    data: { channel }
  });
}));

// DELETE /api/v1/admin/invoices/:id - Eliminar factura
router.delete('/:id', isAdmin, asyncHandler(async (req, res) => {
  const invoice = await Invoice.getById(req.params.id);

  if (!invoice) {
    throw createError.notFound('Factura no encontrada');
  }

  if (invoice.status === 'paid') {
    throw createError.badRequest('No se puede eliminar una factura pagada');
  }

  await Invoice.delete(req.params.id);

  res.json({
    success: true,
    message: 'Factura eliminada'
  });
}));

// GET /api/v1/admin/invoices/client/:clientId - Facturas de un cliente
router.get('/client/:clientId', isEditor, asyncHandler(async (req, res) => {
  const invoices = await Invoice.getByClient(req.params.clientId);

  res.json({
    success: true,
    count: invoices.length,
    data: invoices
  });
}));

module.exports = router;
