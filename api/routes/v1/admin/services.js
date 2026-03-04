// Rutas admin de servicios
const express = require('express');
const router = express.Router();
const serviceController = require('../../../controllers/serviceController');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { uploadService } = require('../../../config/cloudinary');
const { validateService } = require('../../../middleware/validate');

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/v1/admin/services - Obtener todos los servicios
router.get('/', isEditor, serviceController.getAllServices);

// GET /api/v1/admin/services/stats - Obtener estadisticas
router.get('/stats', isEditor, serviceController.getServiceStats);

// GET /api/v1/admin/services/:id - Obtener servicio por ID
router.get('/:id', isEditor, serviceController.getServiceById);

// POST /api/v1/admin/services - Crear servicio
router.post('/', isAdmin, uploadService.single('image'), validateService, serviceController.createService);

// PUT /api/v1/admin/services/:id - Actualizar servicio
router.put('/:id', isAdmin, uploadService.single('image'), serviceController.updateService);

// DELETE /api/v1/admin/services/:id - Eliminar servicio
router.delete('/:id', isAdmin, serviceController.deleteService);

// PATCH /api/v1/admin/services/:id/toggle - Toggle activo
router.patch('/:id/toggle', isAdmin, serviceController.toggleServiceActive);

// PATCH /api/v1/admin/services/:id/featured - Toggle destacado
router.patch('/:id/featured', isAdmin, serviceController.toggleServiceFeatured);

// POST /api/v1/admin/services/reorder - Reordenar servicios
router.post('/reorder', isAdmin, serviceController.reorderServices);

// POST /api/v1/admin/services/:id/duplicate - Duplicar servicio
router.post('/:id/duplicate', isAdmin, serviceController.duplicateService);

// POST /api/v1/admin/services/upload - Subir imagen
router.post('/upload', isAdmin, uploadService.single('image'), serviceController.uploadServiceImage);

module.exports = router;
