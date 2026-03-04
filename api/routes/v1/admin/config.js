// Rutas admin de configuracion
const express = require('express');
const router = express.Router();
const configController = require('../../../controllers/configController');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin } = require('../../../middleware/roles');
const { uploadLogo } = require('../../../config/cloudinary');

// Todas las rutas requieren autenticacion y rol admin
router.use(authenticate);
router.use(isAdmin);

// GET /api/v1/admin/config - Obtener toda la configuracion
router.get('/', configController.getAllConfig);

// GET /api/v1/admin/config/category/:category - Obtener por categoria
router.get('/category/:category', configController.getConfigByCategory);

// PUT /api/v1/admin/config - Actualizar configuracion individual
router.put('/', configController.updateConfig);

// PUT /api/v1/admin/config/bulk - Actualizar multiples configuraciones
router.put('/bulk', configController.updateBulkConfig);

// PUT /api/v1/admin/config/logo - Actualizar logo
router.put('/logo', uploadLogo.single('logo'), configController.updateLogo);

// POST /api/v1/admin/config/upload-logo - Subir logo (nuevo endpoint)
router.post('/upload-logo', uploadLogo.single('image'), configController.uploadLogoImage);

// PUT /api/v1/admin/config/contact - Actualizar info de contacto
router.put('/contact', configController.updateContactInfo);

// PUT /api/v1/admin/config/social - Actualizar redes sociales
router.put('/social', configController.updateSocialLinks);

// PUT /api/v1/admin/config/colors - Actualizar colores
router.put('/colors', configController.updateColors);

// PUT /api/v1/admin/config/seo - Actualizar SEO
router.put('/seo', configController.updateSEO);

// PUT /api/v1/admin/config/schedule - Actualizar horarios
router.put('/schedule', configController.updateSchedule);

// DELETE /api/v1/admin/config/:key - Eliminar configuracion
router.delete('/:key', configController.deleteConfig);

// POST /api/v1/admin/config/reset - Resetear a valores por defecto
router.post('/reset', configController.resetToDefaults);

module.exports = router;
