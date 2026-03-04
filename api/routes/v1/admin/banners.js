// Rutas admin de banners
const express = require('express');
const router = express.Router();
const bannerController = require('../../../controllers/bannerController');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { uploadBanner } = require('../../../config/cloudinary');
const { validateBanner } = require('../../../middleware/validate');

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/v1/admin/banners - Obtener todos los banners
router.get('/', isEditor, bannerController.getAllBanners);

// GET /api/v1/admin/banners/:id - Obtener banner por ID
router.get('/:id', isEditor, bannerController.getBannerById);

// POST /api/v1/admin/banners - Crear banner
router.post('/', isAdmin, uploadBanner.single('image'), validateBanner, bannerController.createBanner);

// PUT /api/v1/admin/banners/:id - Actualizar banner
router.put('/:id', isAdmin, uploadBanner.single('image'), bannerController.updateBanner);

// DELETE /api/v1/admin/banners/:id - Eliminar banner
router.delete('/:id', isAdmin, bannerController.deleteBanner);

// PATCH /api/v1/admin/banners/:id/toggle - Toggle activo
router.patch('/:id/toggle', isAdmin, bannerController.toggleBannerActive);

// POST /api/v1/admin/banners/reorder - Reordenar banners
router.post('/reorder', isAdmin, bannerController.reorderBanners);

// POST /api/v1/admin/banners/:id/duplicate - Duplicar banner
router.post('/:id/duplicate', isAdmin, bannerController.duplicateBanner);

// POST /api/v1/admin/banners/upload - Subir imagen
router.post('/upload', isAdmin, uploadBanner.single('image'), bannerController.uploadBannerImage);

module.exports = router;
