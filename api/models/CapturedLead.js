// Modelo de Leads Capturados
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

let memoryLeads = [];
let leadIdCounter = 1;

class CapturedLead {
    static async getAll() {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabaseAdmin
                .from('captured_leads')
                .select(`
          *,
          marketing_campaigns (title, magnet_type)
        `)
                .order('created_at', { ascending: false });

            if (error && error.code !== '42P01') throw error;
            if (data) return data;
        }

        return memoryLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    static async create(data) {
        const newLead = {
            name: data.name,
            email: data.email,
            campaign_id: data.campaign_id || null,
            source: data.source || 'website_popup'
        };

        if (isSupabaseConfigured()) {
            const { data: created, error } = await supabaseAdmin
                .from('captured_leads')
                .insert(newLead)
                .select()
                .single();

            if (!error) return created;
        }

        const memoryLead = {
            id: leadIdCounter++,
            ...newLead,
            created_at: new Date().toISOString()
        };
        memoryLeads.push(memoryLead);
        return memoryLead;
    }
}

module.exports = CapturedLead;
