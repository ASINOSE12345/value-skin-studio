// Modelo de Clientes - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
let memoryClients = [];

// ============================================
// CLASE CLIENT
// ============================================
class Client {
  // Obtener todos los clientes con paginacion
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
      status = null,
      clientType = null,
      search = null
    } = options;

    const offset = (page - 1) * limit;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact' });

      // Filtros
      if (status) query = query.eq('status', status);
      if (clientType) query = query.eq('client_type', clientType);
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      // Ordenamiento y paginacion
      query = query
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    }

    // Fallback en memoria
    let clients = [...memoryClients];

    // Filtros
    if (status) clients = clients.filter(c => c.status === status);
    if (clientType) clients = clients.filter(c => c.client_type === clientType);
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(c =>
        c.first_name.toLowerCase().includes(searchLower) ||
        c.last_name.toLowerCase().includes(searchLower) ||
        (c.email && c.email.toLowerCase().includes(searchLower)) ||
        (c.phone && c.phone.includes(search))
      );
    }

    // Ordenamiento
    clients.sort((a, b) => {
      const aVal = a[sort] || '';
      const bVal = b[sort] || '';
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Paginacion
    const total = clients.length;
    const paginatedClients = clients.slice(offset, offset + limit);

    return {
      data: paginatedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Obtener cliente por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryClients.find(c => c.id === id);
  }

  // Obtener cliente por email
  static async getByEmail(email) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryClients.find(c => c.email === email);
  }

  // Crear cliente
  static async create(clientData) {
    const newClient = {
      first_name: clientData.firstName || clientData.first_name,
      last_name: clientData.lastName || clientData.last_name,
      email: clientData.email || null,
      phone: clientData.phone || null,
      whatsapp: clientData.whatsapp || null,
      birth_date: clientData.birthDate || clientData.birth_date || null,
      gender: clientData.gender || null,
      address_street: clientData.addressStreet || clientData.address_street || null,
      address_city: clientData.addressCity || clientData.address_city || null,
      address_province: clientData.addressProvince || clientData.address_province || null,
      address_postal_code: clientData.addressPostalCode || clientData.address_postal_code || null,
      client_type: clientData.clientType || clientData.client_type || 'individual',
      company_name: clientData.companyName || clientData.company_name || null,
      notes: clientData.notes || null,
      source: clientData.source || 'web',
      tags: clientData.tags || [],
      newsletter: clientData.newsletter || false,
      status: clientData.status || 'active',
      total_spent: clientData.totalSpent || clientData.total_spent || 0,
      last_visit: clientData.lastVisit || clientData.last_visit || null
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert(newClient)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryClient = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newClient,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryClients.push(memoryClient);
    return memoryClient;
  }

  // Actualizar cliente
  static async update(id, updateData) {
    const updates = {};

    if (updateData.firstName !== undefined) updates.first_name = updateData.firstName;
    if (updateData.first_name !== undefined) updates.first_name = updateData.first_name;
    if (updateData.lastName !== undefined) updates.last_name = updateData.lastName;
    if (updateData.last_name !== undefined) updates.last_name = updateData.last_name;
    if (updateData.email !== undefined) updates.email = updateData.email;
    if (updateData.phone !== undefined) updates.phone = updateData.phone;
    if (updateData.whatsapp !== undefined) updates.whatsapp = updateData.whatsapp;
    if (updateData.birthDate !== undefined) updates.birth_date = updateData.birthDate;
    if (updateData.birth_date !== undefined) updates.birth_date = updateData.birth_date;
    if (updateData.gender !== undefined) updates.gender = updateData.gender;
    if (updateData.addressStreet !== undefined) updates.address_street = updateData.addressStreet;
    if (updateData.addressCity !== undefined) updates.address_city = updateData.addressCity;
    if (updateData.addressProvince !== undefined) updates.address_province = updateData.addressProvince;
    if (updateData.addressPostalCode !== undefined) updates.address_postal_code = updateData.addressPostalCode;
    if (updateData.clientType !== undefined) updates.client_type = updateData.clientType;
    if (updateData.client_type !== undefined) updates.client_type = updateData.client_type;
    if (updateData.companyName !== undefined) updates.company_name = updateData.companyName;
    if (updateData.company_name !== undefined) updates.company_name = updateData.company_name;
    if (updateData.notes !== undefined) updates.notes = updateData.notes;
    if (updateData.source !== undefined) updates.source = updateData.source;
    if (updateData.tags !== undefined) updates.tags = updateData.tags;
    if (updateData.newsletter !== undefined) updates.newsletter = updateData.newsletter;
    if (updateData.status !== undefined) updates.status = updateData.status;
    if (updateData.totalSpent !== undefined) updates.total_spent = updateData.totalSpent;
    if (updateData.total_spent !== undefined) updates.total_spent = updateData.total_spent;
    if (updateData.lastVisit !== undefined) updates.last_visit = updateData.lastVisit;
    if (updateData.last_visit !== undefined) updates.last_visit = updateData.last_visit;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryClients.findIndex(c => c.id === id);
    if (index === -1) return null;

    memoryClients[index] = {
      ...memoryClients[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryClients[index];
  }

  // Eliminar cliente
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryClients.findIndex(c => c.id === id);
    if (index === -1) return false;

    memoryClients.splice(index, 1);
    return true;
  }

  // Obtener historial del cliente (turnos y contactos)
  static async getHistory(id) {
    if (isSupabaseConfigured()) {
      const [appointmentsResult, contactsResult] = await Promise.all([
        supabaseAdmin
          .from('appointments')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('contacts')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false })
      ]);

      return {
        appointments: appointmentsResult.data || [],
        contacts: contactsResult.data || []
      };
    }

    // En memoria no hay relaciones, retornar vacio
    return {
      appointments: [],
      contacts: []
    };
  }

  // Buscar clientes
  static async search(query, limit = 10) {
    const searchTerm = query.toLowerCase();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;
      return data;
    }

    return memoryClients
      .filter(c =>
        c.first_name.toLowerCase().includes(searchTerm) ||
        c.last_name.toLowerCase().includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
        (c.phone && c.phone.includes(query))
      )
      .slice(0, limit);
  }

  // Actualizar gasto total
  static async updateTotalSpent(id, amount) {
    const client = await this.getById(id);
    if (!client) return null;

    const newTotal = (client.total_spent || 0) + amount;
    return await this.update(id, { total_spent: newTotal });
  }

  // Actualizar ultima visita
  static async updateLastVisit(id) {
    return await this.update(id, { last_visit: new Date().toISOString() });
  }

  // Contar clientes
  static async count(options = {}) {
    const { status = null, clientType = null } = options;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (status) query = query.eq('status', status);
      if (clientType) query = query.eq('client_type', clientType);

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }

    let clients = memoryClients;
    if (status) clients = clients.filter(c => c.status === status);
    if (clientType) clients = clients.filter(c => c.client_type === clientType);
    return clients.length;
  }

  // Obtener clientes VIP
  static async getVIP(limit = 10) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('status', 'vip')
        .order('total_spent', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }

    return memoryClients
      .filter(c => c.status === 'vip')
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, limit);
  }

  // Obtener clientes por tags
  static async getByTag(tag) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .contains('tags', [tag]);

      if (error) throw error;
      return data;
    }

    return memoryClients.filter(c => c.tags && c.tags.includes(tag));
  }

  // Exportar clientes a formato CSV-ready
  static async export(options = {}) {
    const { data } = await this.getAll({ ...options, limit: 10000 });

    return data.map(c => ({
      id: c.id,
      nombre: c.first_name,
      apellido: c.last_name,
      email: c.email || '',
      telefono: c.phone || '',
      whatsapp: c.whatsapp || '',
      tipo: c.client_type,
      empresa: c.company_name || '',
      estado: c.status,
      gasto_total: c.total_spent || 0,
      ultima_visita: c.last_visit || '',
      fecha_creacion: c.created_at
    }));
  }

  // Crear o actualizar cliente desde contacto
  static async findOrCreateFromContact(contactData) {
    // Buscar por email primero
    if (contactData.email) {
      const existing = await this.getByEmail(contactData.email);
      if (existing) return existing;
    }

    // Parsear nombre completo
    const nameParts = contactData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Crear nuevo cliente
    return await this.create({
      firstName,
      lastName,
      email: contactData.email,
      phone: contactData.phone,
      clientType: contactData.type === 'hotel' ? 'hotel' :
                  contactData.type === 'empresa' ? 'empresa' : 'individual',
      source: 'web'
    });
  }
}

module.exports = Client;
