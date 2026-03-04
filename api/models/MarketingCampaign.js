// Modelo de Campañas de Marketing (Lead Magnets)
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

let memoryCampaigns = [];
let campaignIdCounter = 1;

class MarketingCampaign {
    static async getAll(options = {}) {
        const { status = null } = options;

        if (isSupabaseConfigured()) {
            let query = supabaseAdmin.from('marketing_campaigns').select('*');
            if (status) query = query.eq('status', status);
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error && error.code !== '42P01') throw error; // Ignorar error de tabla no existente en fallback
            if (data) return data;
        }

        let campaigns = [...memoryCampaigns];
        if (status) campaigns = campaigns.filter(c => c.status === status);
        return campaigns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    static async getActive() {
        const campaigns = await this.getAll({ status: 'active' });
        return campaigns.length > 0 ? campaigns[0] : null; // Solo devolver la primera activa
    }

    static async create(data) {
        const newCampaign = {
            title: data.title,
            subtitle: data.subtitle,
            button_text: data.button_text,
            magnet_type: data.magnet_type, // 'ebook', 'discount'
            magnet_resource: data.magnet_resource, // URL del PDF o Código de descuento
            status: data.status || 'inactive'
        };

        if (isSupabaseConfigured()) {
            const { data: created, error } = await supabaseAdmin
                .from('marketing_campaigns')
                .insert(newCampaign)
                .select()
                .single();

            if (!error) return created;
        }

        const memoryCampaign = {
            id: campaignIdCounter++,
            ...newCampaign,
            created_at: new Date().toISOString()
        };
        memoryCampaigns.push(memoryCampaign);
        return memoryCampaign;
    }
}

module.exports = MarketingCampaign;
