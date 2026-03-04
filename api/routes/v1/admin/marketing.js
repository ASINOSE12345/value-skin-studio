const express = require('express');
const router = express.Router();
const marketingController = require('../../../controllers/marketingController');
const { verifyToken } = require('../../../middleware/auth');
const { isAdmin } = require('../../../middleware/roles');

// Todas las rutas requieren auth y rol admin
router.use(verifyToken);
router.use(isAdmin);

// Campanas
router.get('/campaigns', marketingController.getAllCampaigns);
router.post('/campaigns', marketingController.createCampaign);

// Leads capturados
router.get('/leads', marketingController.getAllLeads);

module.exports = router;
