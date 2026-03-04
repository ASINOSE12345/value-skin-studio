const express = require('express');
const router = express.Router();
const marketingController = require('../../controllers/marketingController');

// Obtener campana activa (popup)
router.get('/campaigns/active', marketingController.getActiveCampaign);

// Capturar lead (con anti-spam simple)
router.post('/leads', marketingController.captureLead);

module.exports = router;
