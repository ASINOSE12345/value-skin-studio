// Rutas publicas de promociones
const express = require('express');
const router = express.Router();
const promotionController = require('../../controllers/promotionController');

// GET /api/v1/promotions - Obtener promociones activas
router.get('/', promotionController.getActivePromotions);

// GET /api/v1/promotions/home - Obtener promociones para home
router.get('/home', promotionController.getHomePromotions);

// POST /api/v1/promotions/validate - Validar codigo de promocion
router.post('/validate', promotionController.validatePromoCode);

// GET /api/v1/promotions/code/:code - Obtener promocion por codigo
router.get('/code/:code', promotionController.getPromotionByCode);

module.exports = router;
