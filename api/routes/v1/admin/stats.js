// Rutas admin de estadisticas
const express = require('express');
const router = express.Router();
const statsController = require('../../../controllers/statsController');
const { authenticate } = require('../../../middleware/auth');
const { isEditor } = require('../../../middleware/roles');

// Todas las rutas requieren autenticacion y rol editor+
router.use(authenticate);
router.use(isEditor);

// GET /api/v1/admin/stats - Dashboard general
router.get('/', statsController.getDashboardStats);

// GET /api/v1/admin/stats/contacts - Estadisticas de contactos
router.get('/contacts', statsController.getContactStats);

// GET /api/v1/admin/stats/appointments - Estadisticas de citas
router.get('/appointments', statsController.getAppointmentStats);

// GET /api/v1/admin/stats/clients - Estadisticas de clientes
router.get('/clients', statsController.getClientStats);

// GET /api/v1/admin/stats/services - Estadisticas de servicios
router.get('/services', statsController.getServiceStats);

// GET /api/v1/admin/stats/promotions - Estadisticas de promociones
router.get('/promotions', statsController.getPromotionStats);

// GET /api/v1/admin/stats/activity - Actividad reciente
router.get('/activity', statsController.getRecentActivity);

// GET /api/v1/admin/stats/performance - Metricas de rendimiento
router.get('/performance', statsController.getPerformanceMetrics);

// GET /api/v1/admin/stats/top-services - Top servicios
router.get('/top-services', statsController.getTopServices);

module.exports = router;
