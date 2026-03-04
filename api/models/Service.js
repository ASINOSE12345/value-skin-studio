// Modelo de Servicios - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const slugify = require('slugify');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
let memoryServices = [
  // Servicios Para Ti
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Post-Operatorio',
    slug: 'post-operatorio',
    description: 'Programa completo de recuperacion post-quirurgica con tecnicas especializadas.',
    short_description: 'Recuperacion profesional post-cirugia',
    category: 'para-ti',
    sessions: 8,
    weeks: 4,
    per_session_minutes: 60,
    features: ['Drenaje linfatico manual', 'Presoterapia progresiva', 'Ultracavitacion', 'Radiofrecuencia'],
    base_price: 180000,
    currency: 'ARS',
    price_text: 'Desde $180.000',
    per_unit: 'programa',
    image_url: null,
    icon: null,
    color: null,
    featured: false,
    badge: null,
    display_order: 1,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Reductor Intensivo',
    slug: 'reductor-intensivo',
    description: 'Programa intensivo para reduccion de medidas con tecnologia de avanzada.',
    short_description: 'Reduccion de medidas efectiva',
    category: 'para-ti',
    sessions: 6,
    weeks: 3,
    per_session_minutes: 60,
    features: ['Ultracavitacion', 'Radiofrecuencia', 'Masaje reductor', 'Presoterapia'],
    base_price: 150000,
    currency: 'ARS',
    price_text: 'Desde $150.000',
    per_unit: 'programa',
    image_url: null,
    icon: null,
    color: null,
    featured: true,
    badge: 'Mas Popular',
    display_order: 2,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Piernas Ligeras',
    slug: 'piernas-ligeras',
    description: 'Tratamiento especializado para mejorar la circulacion y reducir la pesadez.',
    short_description: 'Alivio para piernas cansadas',
    category: 'para-ti',
    sessions: 4,
    weeks: 4,
    per_session_minutes: 45,
    features: ['Drenaje linfatico', 'Presoterapia', 'Criofrecuencia', 'Gel frio de regalo'],
    base_price: 80000,
    currency: 'ARS',
    price_text: 'Desde $80.000',
    per_unit: 'programa',
    image_url: null,
    icon: null,
    color: null,
    featured: false,
    badge: null,
    display_order: 3,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Anti-Estres',
    slug: 'anti-estres',
    description: 'Programa de relajacion profunda para combatir el estres y la tension.',
    short_description: 'Relajacion profunda garantizada',
    category: 'para-ti',
    sessions: 6,
    weeks: 6,
    per_session_minutes: 60,
    features: ['Masaje relajante 60\'', 'Aromaterapia', 'Hot stones', 'Reflexologia podal'],
    base_price: 120000,
    currency: 'ARS',
    price_text: 'Desde $120.000',
    per_unit: 'programa',
    image_url: null,
    icon: null,
    color: null,
    featured: false,
    badge: null,
    display_order: 4,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Servicios Empresas
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Dia de Bienestar',
    slug: 'dia-bienestar',
    description: 'Evento unico para equipos de trabajo.',
    short_description: 'Evento unico para equipos',
    category: 'empresas',
    sessions: 1,
    weeks: null,
    per_session_minutes: null,
    features: [],
    base_price: 8000,
    currency: 'ARS',
    price_text: '$8.000',
    per_unit: 'por empleado',
    image_url: null,
    icon: null,
    color: null,
    featured: false,
    badge: null,
    display_order: 1,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Programa Mensual',
    slug: 'programa-mensual',
    description: '1 jornada por mes de bienestar corporativo.',
    short_description: '1 jornada por mes',
    category: 'empresas',
    sessions: 1,
    weeks: null,
    per_session_minutes: null,
    features: [],
    base_price: 7000,
    currency: 'ARS',
    price_text: '$7.000',
    per_unit: 'por empleado/mes',
    image_url: null,
    icon: null,
    color: null,
    featured: true,
    badge: 'Recomendado',
    display_order: 2,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Beneficio Sin Costo',
    slug: 'beneficio-sin-costo',
    description: 'Convenio empresa sin costo para la organizacion.',
    short_description: 'Convenio empresa',
    category: 'empresas',
    sessions: null,
    weeks: null,
    per_session_minutes: null,
    features: [],
    base_price: 0,
    currency: 'ARS',
    price_text: '$0',
    per_unit: 'para la empresa',
    image_url: null,
    icon: null,
    color: null,
    featured: false,
    badge: null,
    display_order: 3,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Escuela
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Masaje Hotelero Profesional',
    slug: 'masaje-hotelero-profesional',
    description: '2 dias intensivos | Cupos limitados: 8 personas',
    short_description: 'Formacion profesional con salida laboral',
    category: 'escuela',
    sessions: 2,
    weeks: null,
    per_session_minutes: 480,
    features: [],
    base_price: 90000,
    currency: 'ARS',
    price_text: '$90.000',
    per_unit: 'curso completo',
    image_url: null,
    icon: null,
    color: null,
    featured: false,
    badge: null,
    display_order: 1,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ============================================
// CLASE SERVICE
// ============================================
class Service {
  // Generar slug unico
  static generateSlug(name) {
    return slugify(name, {
      lower: true,
      strict: true,
      locale: 'es'
    });
  }

  // Obtener todos los servicios
  static async getAll(includeInactive = false) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let services = [...memoryServices];
    if (!includeInactive) {
      services = services.filter(s => s.active);
    }
    return services.sort((a, b) => a.display_order - b.display_order);
  }

  // Obtener servicios por categoria
  static async getByCategory(category, includeInactive = false) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('services')
        .select('*')
        .eq('category', category)
        .order('display_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let services = memoryServices.filter(s => s.category === category);
    if (!includeInactive) {
      services = services.filter(s => s.active);
    }
    return services.sort((a, b) => a.display_order - b.display_order);
  }

  // Obtener servicio por slug
  static async getBySlug(slug) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryServices.find(s => s.slug === slug);
  }

  // Obtener servicio por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryServices.find(s => s.id === id);
  }

  // Crear servicio
  static async create(serviceData) {
    const slug = serviceData.slug || this.generateSlug(serviceData.name);

    const newService = {
      name: serviceData.name,
      slug: slug,
      description: serviceData.description || null,
      short_description: serviceData.shortDescription || serviceData.short_description || null,
      category: serviceData.category,
      sessions: serviceData.sessions || null,
      weeks: serviceData.weeks || null,
      per_session_minutes: serviceData.perSessionMinutes || serviceData.per_session_minutes || null,
      features: serviceData.features || [],
      base_price: serviceData.basePrice || serviceData.base_price || null,
      currency: serviceData.currency || 'ARS',
      price_text: serviceData.priceText || serviceData.price_text || null,
      per_unit: serviceData.perUnit || serviceData.per_unit || 'programa',
      image_url: serviceData.imageUrl || serviceData.image_url || null,
      icon: serviceData.icon || null,
      color: serviceData.color || null,
      featured: serviceData.featured || false,
      badge: serviceData.badge || null,
      display_order: serviceData.displayOrder || serviceData.display_order || 0,
      active: serviceData.active !== undefined ? serviceData.active : true
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('services')
        .insert(newService)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryService = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newService,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryServices.push(memoryService);
    return memoryService;
  }

  // Actualizar servicio
  static async update(id, updateData) {
    const updates = {};

    if (updateData.name !== undefined) {
      updates.name = updateData.name;
      // Actualizar slug si se cambia el nombre
      if (!updateData.slug) {
        updates.slug = this.generateSlug(updateData.name);
      }
    }
    if (updateData.slug !== undefined) updates.slug = updateData.slug;
    if (updateData.description !== undefined) updates.description = updateData.description;
    if (updateData.shortDescription !== undefined) updates.short_description = updateData.shortDescription;
    if (updateData.short_description !== undefined) updates.short_description = updateData.short_description;
    if (updateData.category !== undefined) updates.category = updateData.category;
    if (updateData.sessions !== undefined) updates.sessions = updateData.sessions;
    if (updateData.weeks !== undefined) updates.weeks = updateData.weeks;
    if (updateData.perSessionMinutes !== undefined) updates.per_session_minutes = updateData.perSessionMinutes;
    if (updateData.features !== undefined) updates.features = updateData.features;
    if (updateData.basePrice !== undefined) updates.base_price = updateData.basePrice;
    if (updateData.base_price !== undefined) updates.base_price = updateData.base_price;
    if (updateData.currency !== undefined) updates.currency = updateData.currency;
    if (updateData.priceText !== undefined) updates.price_text = updateData.priceText;
    if (updateData.price_text !== undefined) updates.price_text = updateData.price_text;
    if (updateData.perUnit !== undefined) updates.per_unit = updateData.perUnit;
    if (updateData.per_unit !== undefined) updates.per_unit = updateData.per_unit;
    if (updateData.imageUrl !== undefined) updates.image_url = updateData.imageUrl;
    if (updateData.image_url !== undefined) updates.image_url = updateData.image_url;
    if (updateData.icon !== undefined) updates.icon = updateData.icon;
    if (updateData.color !== undefined) updates.color = updateData.color;
    if (updateData.featured !== undefined) updates.featured = updateData.featured;
    if (updateData.badge !== undefined) updates.badge = updateData.badge;
    if (updateData.displayOrder !== undefined) updates.display_order = updateData.displayOrder;
    if (updateData.display_order !== undefined) updates.display_order = updateData.display_order;
    if (updateData.active !== undefined) updates.active = updateData.active;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryServices.findIndex(s => s.id === id);
    if (index === -1) return null;

    memoryServices[index] = {
      ...memoryServices[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryServices[index];
  }

  // Eliminar servicio
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryServices.findIndex(s => s.id === id);
    if (index === -1) return false;

    memoryServices.splice(index, 1);
    return true;
  }

  // Reordenar servicios
  static async reorder(orderedIds) {
    if (isSupabaseConfigured()) {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabaseAdmin
          .from('services')
          .update({ display_order: i + 1 })
          .eq('id', orderedIds[i]);
      }

      return await this.getAll(true);
    }

    // Fallback en memoria
    orderedIds.forEach((id, index) => {
      const service = memoryServices.find(s => s.id === id);
      if (service) {
        service.display_order = index + 1;
        service.updated_at = new Date().toISOString();
      }
    });

    return memoryServices.sort((a, b) => a.display_order - b.display_order);
  }

  // Toggle activo/inactivo
  static async toggleActive(id) {
    const service = await this.getById(id);
    if (!service) return null;

    return await this.update(id, { active: !service.active });
  }

  // Toggle destacado
  static async toggleFeatured(id) {
    const service = await this.getById(id);
    if (!service) return null;

    return await this.update(id, { featured: !service.featured });
  }

  // Contar servicios
  static async count(category = null) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('services')
        .select('*', { count: 'exact', head: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }

    if (category) {
      return memoryServices.filter(s => s.category === category).length;
    }
    return memoryServices.length;
  }

  // Buscar servicios
  static async search(query) {
    const searchTerm = query.toLowerCase();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    }

    return memoryServices.filter(s =>
      s.name.toLowerCase().includes(searchTerm) ||
      (s.description && s.description.toLowerCase().includes(searchTerm))
    );
  }

  // Obtener solo servicios activos (alias de getAll sin inactivos)
  static async getActive() {
    return this.getAll(false);
  }

  // Obtener servicios destacados
  static async getFeatured() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('active', true)
        .eq('featured', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    }

    return memoryServices.filter(s => s.active && s.featured)
      .sort((a, b) => a.display_order - b.display_order);
  }
}

module.exports = Service;
