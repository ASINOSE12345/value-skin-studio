// Modelo de Banners - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
let memoryBanners = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Hero Principal',
    section: 'hero',
    image_url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1920&q=80',
    image_alt: 'Spa y bienestar',
    image_width: 1920,
    image_height: 1080,
    title: 'Bienestar Profesional en Posadas',
    subtitle: 'Masajes terapeuticos | Estetica avanzada | Programas personalizados',
    cta_text: null,
    cta_link: null,
    overlay_enabled: true,
    overlay_color: 'rgba(44, 95, 79, 0.6)',
    overlay_opacity: 0.6,
    display_order: 1,
    active: true,
    start_date: null,
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'CTA Final',
    section: 'cta',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80',
    image_alt: 'Llamada a la accion',
    image_width: 1920,
    image_height: 1080,
    title: null,
    subtitle: null,
    cta_text: null,
    cta_link: null,
    overlay_enabled: true,
    overlay_color: 'rgba(44, 95, 79, 0.88)',
    overlay_opacity: 0.88,
    display_order: 1,
    active: true,
    start_date: null,
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ============================================
// CLASE BANNER
// ============================================
class Banner {
  // Obtener todos los banners
  static async getAll(includeInactive = false) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let banners = [...memoryBanners];
    if (!includeInactive) {
      banners = banners.filter(b => b.active);
    }
    return banners.sort((a, b) => a.display_order - b.display_order);
  }

  // Obtener banners por seccion
  static async getBySection(section, includeInactive = false) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('banners')
        .select('*')
        .eq('section', section)
        .order('display_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('active', true);
        // Filtrar por fechas de vigencia
        const now = new Date().toISOString();
        query = query.or(`start_date.is.null,start_date.lte.${now}`);
        query = query.or(`end_date.is.null,end_date.gte.${now}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let banners = memoryBanners.filter(b => b.section === section);
    if (!includeInactive) {
      const now = new Date();
      banners = banners.filter(b => {
        if (!b.active) return false;
        if (b.start_date && new Date(b.start_date) > now) return false;
        if (b.end_date && new Date(b.end_date) < now) return false;
        return true;
      });
    }
    return banners.sort((a, b) => a.display_order - b.display_order);
  }

  // Obtener banner por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('banners')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryBanners.find(b => b.id === id);
  }

  // Crear banner
  static async create(bannerData) {
    const newBanner = {
      name: bannerData.name,
      section: bannerData.section,
      image_url: bannerData.imageUrl || bannerData.image_url,
      image_alt: bannerData.imageAlt || bannerData.image_alt || '',
      image_width: bannerData.imageWidth || bannerData.image_width || null,
      image_height: bannerData.imageHeight || bannerData.image_height || null,
      title: bannerData.title || null,
      subtitle: bannerData.subtitle || null,
      cta_text: bannerData.ctaText || bannerData.cta_text || null,
      cta_link: bannerData.ctaLink || bannerData.cta_link || null,
      overlay_enabled: bannerData.overlayEnabled !== undefined ? bannerData.overlayEnabled : true,
      overlay_color: bannerData.overlayColor || bannerData.overlay_color || 'rgba(44, 95, 79, 0.6)',
      overlay_opacity: bannerData.overlayOpacity || bannerData.overlay_opacity || 0.6,
      display_order: bannerData.displayOrder || bannerData.display_order || 0,
      active: bannerData.active !== undefined ? bannerData.active : true,
      start_date: bannerData.startDate || bannerData.start_date || null,
      end_date: bannerData.endDate || bannerData.end_date || null
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('banners')
        .insert(newBanner)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryBanner = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newBanner,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryBanners.push(memoryBanner);
    return memoryBanner;
  }

  // Actualizar banner
  static async update(id, updateData) {
    const updates = {};

    if (updateData.name !== undefined) updates.name = updateData.name;
    if (updateData.section !== undefined) updates.section = updateData.section;
    if (updateData.imageUrl !== undefined) updates.image_url = updateData.imageUrl;
    if (updateData.image_url !== undefined) updates.image_url = updateData.image_url;
    if (updateData.imageAlt !== undefined) updates.image_alt = updateData.imageAlt;
    if (updateData.image_alt !== undefined) updates.image_alt = updateData.image_alt;
    if (updateData.imageWidth !== undefined) updates.image_width = updateData.imageWidth;
    if (updateData.imageHeight !== undefined) updates.image_height = updateData.imageHeight;
    if (updateData.title !== undefined) updates.title = updateData.title;
    if (updateData.subtitle !== undefined) updates.subtitle = updateData.subtitle;
    if (updateData.ctaText !== undefined) updates.cta_text = updateData.ctaText;
    if (updateData.cta_text !== undefined) updates.cta_text = updateData.cta_text;
    if (updateData.ctaLink !== undefined) updates.cta_link = updateData.ctaLink;
    if (updateData.cta_link !== undefined) updates.cta_link = updateData.cta_link;
    if (updateData.overlayEnabled !== undefined) updates.overlay_enabled = updateData.overlayEnabled;
    if (updateData.overlayColor !== undefined) updates.overlay_color = updateData.overlayColor;
    if (updateData.overlayOpacity !== undefined) updates.overlay_opacity = updateData.overlayOpacity;
    if (updateData.displayOrder !== undefined) updates.display_order = updateData.displayOrder;
    if (updateData.display_order !== undefined) updates.display_order = updateData.display_order;
    if (updateData.active !== undefined) updates.active = updateData.active;
    if (updateData.startDate !== undefined) updates.start_date = updateData.startDate;
    if (updateData.start_date !== undefined) updates.start_date = updateData.start_date;
    if (updateData.endDate !== undefined) updates.end_date = updateData.endDate;
    if (updateData.end_date !== undefined) updates.end_date = updateData.end_date;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryBanners.findIndex(b => b.id === id);
    if (index === -1) return null;

    memoryBanners[index] = {
      ...memoryBanners[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryBanners[index];
  }

  // Eliminar banner
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryBanners.findIndex(b => b.id === id);
    if (index === -1) return false;

    memoryBanners.splice(index, 1);
    return true;
  }

  // Reordenar banners
  static async reorder(orderedIds) {
    if (isSupabaseConfigured()) {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabaseAdmin
          .from('banners')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      return await this.getAll(true);
    }

    // Fallback en memoria
    orderedIds.forEach((id, index) => {
      const banner = memoryBanners.find(b => b.id === id);
      if (banner) {
        banner.display_order = index + 1;
        banner.updated_at = new Date().toISOString();
      }
    });

    return memoryBanners.sort((a, b) => a.display_order - b.display_order);
  }

  // Toggle activo/inactivo
  static async toggleActive(id) {
    const banner = await this.getById(id);
    if (!banner) return null;

    return await this.update(id, { active: !banner.active });
  }

  // Contar banners
  static async count(section = null) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('banners')
        .select('*', { count: 'exact', head: true });

      if (section) {
        query = query.eq('section', section);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }

    if (section) {
      return memoryBanners.filter(b => b.section === section).length;
    }
    return memoryBanners.length;
  }

  // Obtener solo banners activos (alias de getAll sin inactivos)
  static async getActive() {
    return this.getAll(false);
  }
}

module.exports = Banner;
