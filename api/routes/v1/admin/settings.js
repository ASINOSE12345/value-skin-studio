// Rutas admin de configuración avanzada (marketing, negocio)
const express = require('express');
const router = express.Router();
const MarketingConfig = require('../../../models/MarketingConfig');
const BusinessConfig = require('../../../models/BusinessConfig');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin } = require('../../../middleware/roles');
const { asyncHandler, createError } = require('../../../middleware/errorHandler');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(isAdmin);

// =====================================================
// CONFIGURACIÓN DE MARKETING
// =====================================================

// GET /api/v1/admin/settings/marketing - Obtener config de marketing
router.get('/marketing', asyncHandler(async (req, res) => {
  const config = await MarketingConfig.get();

  res.json({
    success: true,
    data: config
  });
}));

// PUT /api/v1/admin/settings/marketing - Actualizar config de marketing
router.put('/marketing', asyncHandler(async (req, res) => {
  const {
    gtmId,
    ga4Id,
    fbPixelId,
    tiktokPixelId,
    googleAdsId,
    hotjarId,
    customHeadScripts,
    customBodyScripts,
    cookieConsentEnabled
  } = req.body;

  const updated = await MarketingConfig.update({
    gtmId,
    ga4Id,
    fbPixelId,
    tiktokPixelId,
    googleAdsId,
    hotjarId,
    customHeadScripts,
    customBodyScripts,
    cookieConsentEnabled
  });

  res.json({
    success: true,
    message: 'Configuración de marketing actualizada',
    data: updated
  });
}));

// GET /api/v1/admin/settings/marketing/scripts - Obtener scripts generados
router.get('/marketing/scripts', asyncHandler(async (req, res) => {
  const headScripts = await MarketingConfig.getHeadScripts();
  const bodyScripts = await MarketingConfig.getBodyScripts();

  res.json({
    success: true,
    data: {
      head: headScripts,
      body: bodyScripts
    }
  });
}));

// =====================================================
// CONFIGURACIÓN DEL NEGOCIO
// =====================================================

// GET /api/v1/admin/settings/business - Obtener config del negocio
router.get('/business', asyncHandler(async (req, res) => {
  const config = await BusinessConfig.get();

  res.json({
    success: true,
    data: config
  });
}));

// PUT /api/v1/admin/settings/business - Actualizar config del negocio
router.put('/business', asyncHandler(async (req, res) => {
  const updated = await BusinessConfig.update(req.body);

  res.json({
    success: true,
    message: 'Configuración del negocio actualizada',
    data: updated
  });
}));

// GET /api/v1/admin/settings/business/next-invoice - Obtener próximo número de factura
router.get('/business/next-invoice', asyncHandler(async (req, res) => {
  const nextNumber = await BusinessConfig.getNextInvoiceNumber();

  res.json({
    success: true,
    data: {
      nextInvoiceNumber: nextNumber
    }
  });
}));

// =====================================================
// CONFIGURACIÓN GENERAL (TODO EN UNO)
// =====================================================

// GET /api/v1/admin/settings - Obtener toda la configuración
router.get('/', asyncHandler(async (req, res) => {
  const [marketing, business] = await Promise.all([
    MarketingConfig.get(),
    BusinessConfig.get()
  ]);

  res.json({
    success: true,
    data: {
      marketing,
      business
    }
  });
}));

module.exports = router;
