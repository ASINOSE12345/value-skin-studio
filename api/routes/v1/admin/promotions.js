// Rutas admin de promociones
const express = require('express');
const router = express.Router();
const promotionController = require('../../../controllers/promotionController');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { uploadPromo } = require('../../../config/cloudinary');
const { validatePromotion } = require('../../../middleware/validate');

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/v1/admin/promotions - Obtener todas las promociones
router.get('/', isEditor, promotionController.getAllPromotions);

// GET /api/v1/admin/promotions/summary - Obtener resumen
router.get('/summary', isEditor, promotionController.getPromotionsSummary);

// GET /api/v1/admin/promotions/:id - Obtener promocion por ID
router.get('/:id', isEditor, promotionController.getPromotionById);

// GET /api/v1/admin/promotions/:id/stats - Obtener estadisticas de promocion
router.get('/:id/stats', isEditor, promotionController.getPromotionStats);

// POST /api/v1/admin/promotions - Crear promocion
router.post('/', isAdmin, uploadPromo.single('banner'), validatePromotion, promotionController.createPromotion);

// POST /api/v1/admin/promotions/upload - Subir banner
router.post('/upload', isAdmin, uploadPromo.single('banner'), promotionController.uploadPromoBanner);

// PUT /api/v1/admin/promotions/:id - Actualizar promocion
router.put('/:id', isAdmin, uploadPromo.single('banner'), promotionController.updatePromotion);

// DELETE /api/v1/admin/promotions/:id - Eliminar promocion
router.delete('/:id', isAdmin, promotionController.deletePromotion);

// PATCH /api/v1/admin/promotions/:id/toggle - Toggle activo
router.patch('/:id/toggle', isAdmin, promotionController.togglePromotionActive);

// POST /api/v1/admin/promotions/:id/usage - Incrementar uso
router.post('/:id/usage', isAdmin, promotionController.incrementPromotionUsage);

// POST /api/v1/admin/promotions/:id/duplicate - Duplicar promocion
router.post('/:id/duplicate', isAdmin, promotionController.duplicatePromotion);

module.exports = router;
