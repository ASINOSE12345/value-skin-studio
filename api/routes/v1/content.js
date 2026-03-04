// Rutas publicas de contenido
const express = require('express');
const router = express.Router();
const contentController = require('../../controllers/contentController');

// GET /api/v1/content/sections - Obtener secciones disponibles
router.get('/sections', contentController.getSections);

// GET /api/v1/content/:section - Obtener contenido por seccion
router.get('/:section', contentController.getContentBySection);

// GET /api/v1/content/:section/formatted - Obtener contenido formateado
router.get('/:section/formatted', contentController.getFormattedContent);

// GET /api/v1/content/:section/:key - Obtener contenido especifico
router.get('/:section/:key', contentController.getContent);

module.exports = router;
