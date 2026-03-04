const MarketingCampaign = require('../models/MarketingCampaign');
const CapturedLead = require('../models/CapturedLead');

const marketingController = {
    // --- PUBLIC ENDPOINTS ---

    // Obtener campana activa para inyectar en el frontend (Popup)
    getActiveCampaign: async (req, res, next) => {
        try {
            const campaign = await MarketingCampaign.getActive();
            res.json({ success: true, data: campaign });
        } catch (error) {
            next(error);
        }
    },

    // Capturar lead desde el popup
    captureLead: async (req, res, next) => {
        try {
            const { name, email, campaign_id, source } = req.body;

            if (!email || !name) {
                return res.status(400).json({ success: false, message: 'Nombre y Email requeridos' });
            }

            const lead = await CapturedLead.create({ name, email, campaign_id, source });

            // Responder con exito para que el frontend pueda revelar el Lead Magnet
            res.status(201).json({
                success: true,
                message: 'Lead capturado exitosamente',
                data: lead
            });
        } catch (error) {
            next(error);
        }
    },

    // --- ADMIN ENDPOINTS ---

    // Obtener todas las campanas
    getAllCampaigns: async (req, res, next) => {
        try {
            const campaigns = await MarketingCampaign.getAll();
            res.json({ success: true, data: campaigns });
        } catch (error) {
            next(error);
        }
    },

    // Crear nueva campana
    createCampaign: async (req, res, next) => {
        try {
            const campaign = await MarketingCampaign.create(req.body);
            res.status(201).json({ success: true, data: campaign });
        } catch (error) {
            next(error);
        }
    },

    // Obtener todos los leads
    getAllLeads: async (req, res, next) => {
        try {
            const leads = await CapturedLead.getAll();
            res.json({ success: true, data: leads });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = marketingController;
