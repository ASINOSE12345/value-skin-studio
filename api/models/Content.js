// Modelo de Contenido Dinamico - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
let memoryContent = [];

// ============================================
// CLASE CONTENT
// ============================================
class Content {
  // Obtener contenido por seccion
  static async getBySection(section) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('content')
        .select('*')
        .eq('section', section)
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    }

    return memoryContent
      .filter(c => c.section === section && c.active)
      .sort((a, b) => a.display_order - b.display_order);
  }

  // Obtener contenido por seccion y clave
  static async get(section, key) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('content')
        .select('*')
        .eq('section', section)
        .eq('content_key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryContent.find(c => c.section === section && c.content_key === key);
  }

  // Obtener por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('content')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryContent.find(c => c.id === id);
  }

  // Crear contenido
  static async create(contentData) {
    const newContent = {
      section: contentData.section,
      content_key: contentData.key || contentData.content_key,
      content_type: contentData.type || contentData.content_type || 'text',
      content_value: contentData.value || contentData.content_value,
      display_order: contentData.displayOrder || contentData.display_order || 0,
      active: contentData.active !== undefined ? contentData.active : true
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('content')
        .insert(newContent)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryContent.push(memoryItem);
    return memoryItem;
  }

  // Actualizar contenido
  static async update(id, updateData) {
    const updates = {};

    if (updateData.section !== undefined) updates.section = updateData.section;
    if (updateData.key !== undefined) updates.content_key = updateData.key;
    if (updateData.content_key !== undefined) updates.content_key = updateData.content_key;
    if (updateData.type !== undefined) updates.content_type = updateData.type;
    if (updateData.content_type !== undefined) updates.content_type = updateData.content_type;
    if (updateData.value !== undefined) updates.content_value = updateData.value;
    if (updateData.content_value !== undefined) updates.content_value = updateData.content_value;
    if (updateData.displayOrder !== undefined) updates.display_order = updateData.displayOrder;
    if (updateData.display_order !== undefined) updates.display_order = updateData.display_order;
    if (updateData.active !== undefined) updates.active = updateData.active;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryContent.findIndex(c => c.id === id);
    if (index === -1) return null;

    memoryContent[index] = {
      ...memoryContent[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryContent[index];
  }

  // Actualizar o crear (upsert)
  static async upsert(section, key, value, type = 'text') {
    const existing = await this.get(section, key);

    if (existing) {
      return await this.update(existing.id, { value, type });
    }

    return await this.create({
      section,
      key,
      value,
      type
    });
  }

  // Eliminar contenido
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryContent.findIndex(c => c.id === id);
    if (index === -1) return false;

    memoryContent.splice(index, 1);
    return true;
  }

  // Toggle activo/inactivo
  static async toggleActive(id) {
    const content = await this.getById(id);
    if (!content) return null;

    return await this.update(id, { active: !content.active });
  }

  // Obtener todas las secciones
  static async getSections() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('content')
        .select('section')
        .order('section');

      if (error) throw error;

      // Obtener secciones unicas
      const sections = [...new Set(data.map(d => d.section))];
      return sections;
    }

    const sections = [...new Set(memoryContent.map(c => c.section))];
    return sections.sort();
  }

  // Obtener todo el contenido (admin)
  static async getAll() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('content')
        .select('*')
        .order('section')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    }

    return memoryContent.sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.display_order - b.display_order;
    });
  }

  // Obtener contenido formateado para el frontend
  static async getFormatted(section) {
    const content = await this.getBySection(section);

    // Convertir array a objeto por key
    const formatted = {};
    content.forEach(item => {
      formatted[item.content_key] = item.content_value;
    });

    return formatted;
  }

  // Inicializar contenido por defecto para una seccion
  static async initializeSection(section, defaults) {
    for (const [key, config] of Object.entries(defaults)) {
      const existing = await this.get(section, key);
      if (!existing) {
        await this.create({
          section,
          key,
          value: config.value,
          type: config.type || 'text',
          displayOrder: config.order || 0
        });
      }
    }
  }
}

module.exports = Content;
