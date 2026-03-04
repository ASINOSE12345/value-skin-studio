// Rutas publicas de banners
const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/bannerController');

// GET /api/v1/banners - Obtener todos los banners activos
router.get('/', bannerController.getActiveBanners);

// GET /api/v1/banners/hero - Obtener banner hero
router.get('/hero', bannerController.getHeroBanner);

// GET /api/v1/banners/section/:section - Obtener banners por seccion
router.get('/section/:section', bannerController.getBannersBySection);

module.exports = router;
