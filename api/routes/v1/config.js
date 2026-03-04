// Rutas publicas de configuracion
const express = require('express');
const router = express.Router();
const configController = require('../../controllers/configController');

// GET /api/v1/config - Obtener configuracion publica
router.get('/', configController.getPublicConfig);

// GET /api/v1/config/logo - Obtener logo
router.get('/logo', configController.getLogo);

// GET /api/v1/config/contact - Obtener info de contacto
router.get('/contact', configController.getContactInfo);

// GET /api/v1/config/social - Obtener redes sociales
router.get('/social', configController.getSocialLinks);

// GET /api/v1/config/schedule - Obtener horarios
router.get('/schedule', configController.getSchedule);

module.exports = router;
