// Modelo de Configuracion del Sitio - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// CONFIGURACION POR DEFECTO (FALLBACK)
// ============================================
let memoryConfig = {
  id: '00000000-0000-0000-0000-000000000001',
  site_name: 'Value Skin Studio',
  tagline: 'Bienestar Profesional en Posadas',
  description: 'Masajes terapeuticos y estetica de bienestar en Posadas, Misiones.',
  logo_url: null,
  logo_alt: 'Value Skin Studio',
  favicon_url: null,
  colors: {
    primary: '#2C5F4F',
    primaryDark: '#1F4538',
    secondary: '#D4A59A',
    accent: '#C9A86A',
    background: '#F5F1E8',
    white: '#FFFFFF',
    grayStone: '#8C8C88',
    greenWater: '#A8C9C1',
    blackSoft: '#2B2B2B'
  },
  contact: {
    address: 'Av. Costanera 1234',
    city: 'Posadas, Misiones',
    phone: '+54 9 3764 XX-XXXX',
    whatsapp: '+5493764XXXXXX',
    email: 'info@valueskinstudio.com',
    hours: {
      weekdays: 'Lun-Vie: 9:00 - 20:00',
      saturday: 'Sabados: 9:00 - 14:00',
      sunday: 'Domingos: Cerrado'
    }
  },
  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: ''
  },
  seo: {
    title: 'Value Skin Studio - Bienestar Profesional en Posadas',
    description: 'Masajes terapeuticos y estetica de bienestar en Posadas, Misiones. Programas personalizados, spa movil para hoteles y bienestar corporativo.',
    keywords: ['spa', 'masajes', 'bienestar', 'posadas', 'misiones', 'estetica']
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// ============================================
// CLASE SITECONFIG
// ============================================
class SiteConfig {
  // Obtener configuracion
  static async get() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('site_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Si no hay configuracion, crearla
      if (!data) {
        return await this.create(memoryConfig);
      }

      return data;
    }

    return memoryConfig;
  }

  // Crear configuracion inicial
  static async create(configData) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('site_config')
        .insert({
          site_name: configData.site_name || configData.siteName,
          tagline: configData.tagline,
          description: configData.description,
          logo_url: configData.logo_url || configData.logoUrl,
          logo_alt: configData.logo_alt || configData.logoAlt,
          favicon_url: configData.favicon_url || configData.faviconUrl,
          colors: configData.colors,
          contact: configData.contact,
          social: configData.social,
          seo: configData.seo
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    memoryConfig = {
      ...memoryConfig,
      ...configData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return memoryConfig;
  }

  // Actualizar configuracion
  static async update(updateData) {
    const updates = {};

    if (updateData.siteName !== undefined) updates.site_name = updateData.siteName;
    if (updateData.site_name !== undefined) updates.site_name = updateData.site_name;
    if (updateData.tagline !== undefined) updates.tagline = updateData.tagline;
    if (updateData.description !== undefined) updates.description = updateData.description;
    if (updateData.logoUrl !== undefined) updates.logo_url = updateData.logoUrl;
    if (updateData.logo_url !== undefined) updates.logo_url = updateData.logo_url;
    if (updateData.logoAlt !== undefined) updates.logo_alt = updateData.logoAlt;
    if (updateData.logo_alt !== undefined) updates.logo_alt = updateData.logo_alt;
    if (updateData.faviconUrl !== undefined) updates.favicon_url = updateData.faviconUrl;
    if (updateData.favicon_url !== undefined) updates.favicon_url = updateData.favicon_url;
    if (updateData.colors !== undefined) updates.colors = updateData.colors;
    if (updateData.contact !== undefined) updates.contact = updateData.contact;
    if (updateData.social !== undefined) updates.social = updateData.social;
    if (updateData.seo !== undefined) updates.seo = updateData.seo;

    if (isSupabaseConfigured()) {
      // Obtener el ID de la configuracion existente
      const current = await this.get();

      const { data, error } = await supabaseAdmin
        .from('site_config')
        .update(updates)
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    memoryConfig = {
      ...memoryConfig,
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryConfig;
  }

  // Actualizar logo
  static async updateLogo(logoUrl, logoAlt = null) {
    return await this.update({
      logo_url: logoUrl,
      logo_alt: logoAlt || 'Logo'
    });
  }

  // Actualizar favicon
  static async updateFavicon(faviconUrl) {
    return await this.update({
      favicon_url: faviconUrl
    });
  }

  // Actualizar contacto
  static async updateContact(contactData) {
    const current = await this.get();
    const updatedContact = {
      ...current.contact,
      ...contactData
    };

    return await this.update({
      contact: updatedContact
    });
  }

  // Actualizar redes sociales
  static async updateSocial(socialData) {
    const current = await this.get();
    const updatedSocial = {
      ...current.social,
      ...socialData
    };

    return await this.update({
      social: updatedSocial
    });
  }

  // Actualizar SEO
  static async updateSEO(seoData) {
    const current = await this.get();
    const updatedSEO = {
      ...current.seo,
      ...seoData
    };

    return await this.update({
      seo: updatedSEO
    });
  }

  // Actualizar colores
  static async updateColors(colorsData) {
    const current = await this.get();
    const updatedColors = {
      ...current.colors,
      ...colorsData
    };

    return await this.update({
      colors: updatedColors
    });
  }

  // Obtener configuracion publica (sin datos sensibles)
  static async getPublic() {
    const config = await this.get();

    return {
      siteName: config.site_name,
      tagline: config.tagline,
      description: config.description,
      logo: config.logo_url ? {
        url: config.logo_url,
        alt: config.logo_alt
      } : null,
      favicon: config.favicon_url,
      colors: config.colors,
      contact: config.contact,
      social: config.social,
      seo: config.seo
    };
  }

  // Obtener toda la configuracion (alias de get para compatibilidad con controller)
  static async getAll() {
    return await this.get();
  }

  // Obtener configuracion por categoria
  static async getByCategory(category) {
    const config = await this.get();

    switch (category) {
      case 'general':
        return {
          site_name: config.site_name,
          tagline: config.tagline,
          description: config.description,
          logo_url: config.logo_url,
          logo_alt: config.logo_alt,
          favicon_url: config.favicon_url
        };
      case 'colors':
        return config.colors || {};
      case 'contact':
        return config.contact || {};
      case 'social':
        return config.social || {};
      case 'seo':
        return config.seo || {};
      default:
        return config;
    }
  }

  // Establecer un valor de configuracion (set individual)
  static async set(key, value, category = 'general') {
    const config = await this.get();

    // Mapear categorias a campos
    if (category === 'colors') {
      const colors = config.colors || {};
      colors[key] = value;
      return await this.update({ colors });
    } else if (category === 'contact') {
      const contact = config.contact || {};
      contact[key] = value;
      return await this.update({ contact });
    } else if (category === 'social') {
      const social = config.social || {};
      social[key] = value;
      return await this.update({ social });
    } else if (category === 'seo') {
      const seo = config.seo || {};
      seo[key] = value;
      return await this.update({ seo });
    } else {
      // General config fields
      const updates = {};
      updates[key] = value;
      return await this.update(updates);
    }
  }

  // Eliminar (resetear) un valor de configuracion
  static async delete(key) {
    return await this.set(key, null);
  }

  // Resetear a valores por defecto
  static async resetToDefaults() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('site_config')
        .update({
          site_name: memoryConfig.site_name,
          tagline: memoryConfig.tagline,
          description: memoryConfig.description,
          logo_url: memoryConfig.logo_url,
          logo_alt: memoryConfig.logo_alt,
          favicon_url: memoryConfig.favicon_url,
          colors: memoryConfig.colors,
          contact: memoryConfig.contact,
          social: memoryConfig.social,
          seo: memoryConfig.seo
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all rows
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria - reset to original defaults
    const defaultValues = {
      id: '00000000-0000-0000-0000-000000000001',
      site_name: 'Value Skin Studio',
      tagline: 'Bienestar Profesional en Posadas',
      description: 'Masajes terapeuticos y estetica de bienestar en Posadas, Misiones.',
      logo_url: null,
      logo_alt: 'Value Skin Studio',
      favicon_url: null,
      colors: {
        primary: '#2C5F4F',
        primaryDark: '#1F4538',
        secondary: '#D4A59A',
        accent: '#C9A86A',
        background: '#F5F1E8',
        white: '#FFFFFF',
        grayStone: '#8C8C88',
        greenWater: '#A8C9C1',
        blackSoft: '#2B2B2B'
      },
      contact: {
        address: 'Av. Costanera 1234',
        city: 'Posadas, Misiones',
        phone: '+54 9 3764 XX-XXXX',
        whatsapp: '+5493764XXXXXX',
        email: 'info@valueskinstudio.com',
        hours: {
          weekdays: 'Lun-Vie: 9:00 - 20:00',
          saturday: 'Sabados: 9:00 - 14:00',
          sunday: 'Domingos: Cerrado'
        }
      },
      social: {
        instagram: '',
        facebook: '',
        tiktok: '',
        youtube: ''
      },
      seo: {
        title: 'Value Skin Studio - Bienestar Profesional en Posadas',
        description: 'Masajes terapeuticos y estetica de bienestar en Posadas, Misiones. Programas personalizados, spa movil para hoteles y bienestar corporativo.',
        keywords: ['spa', 'masajes', 'bienestar', 'posadas', 'misiones', 'estetica']
      },
      created_at: memoryConfig.created_at,
      updated_at: new Date().toISOString()
    };

    memoryConfig = defaultValues;
    return memoryConfig;
  }
}

module.exports = SiteConfig;
