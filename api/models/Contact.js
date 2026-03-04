// Modelo de Contactos - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
let memoryContacts = [];
let contactIdCounter = 1;

// ============================================
// CLASE CONTACT
// ============================================
class Contact {
  // Obtener todos los contactos
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      status = null,
      type = null,
      sort = 'created_at',
      order = 'desc'
    } = options;

    const offset = (page - 1) * limit;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('contacts')
        .select('*', { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (type) query = query.eq('contact_type', type);

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
    let contacts = [...memoryContacts];

    if (status) contacts = contacts.filter(c => c.status === status);
    if (type) contacts = contacts.filter(c => c.contact_type === type || c.type === type);

    contacts.sort((a, b) => {
      const aVal = a[sort] || a.createdAt || '';
      const bVal = b[sort] || b.createdAt || '';
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    const total = contacts.length;
    const paginatedContacts = contacts.slice(offset, offset + limit);

    return {
      data: paginatedContacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Obtener contacto por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryContacts.find(c => c.id === id || c.id === parseInt(id));
  }

  // Crear contacto
  static async create(contactData) {
    const newContact = {
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      contact_type: contactData.type || contactData.contact_type || 'cliente',
      message: contactData.message || null,
      status: contactData.status || 'pending',
      client_id: contactData.clientId || contactData.client_id || null
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .insert(newContact)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryContact = {
      id: contactIdCounter++,
      ...newContact,
      type: newContact.contact_type, // Mantener compatibilidad
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryContacts.push(memoryContact);
    return memoryContact;
  }

  // Actualizar contacto
  static async update(id, updateData) {
    const updates = {};

    if (updateData.name !== undefined) updates.name = updateData.name;
    if (updateData.email !== undefined) updates.email = updateData.email;
    if (updateData.phone !== undefined) updates.phone = updateData.phone;
    if (updateData.type !== undefined) updates.contact_type = updateData.type;
    if (updateData.contact_type !== undefined) updates.contact_type = updateData.contact_type;
    if (updateData.message !== undefined) updates.message = updateData.message;
    if (updateData.status !== undefined) updates.status = updateData.status;
    if (updateData.clientId !== undefined) updates.client_id = updateData.clientId;
    if (updateData.client_id !== undefined) updates.client_id = updateData.client_id;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryContacts.findIndex(c => c.id === id || c.id === parseInt(id));
    if (index === -1) return null;

    memoryContacts[index] = {
      ...memoryContacts[index],
      ...updates,
      type: updates.contact_type || memoryContacts[index].type,
      updated_at: new Date().toISOString(),
      updatedAt: new Date()
    };

    return memoryContacts[index];
  }

  // Eliminar contacto
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryContacts.findIndex(c => c.id === id || c.id === parseInt(id));
    if (index === -1) return false;

    memoryContacts.splice(index, 1);
    return true;
  }

  // Obtener por estado
  static async getByStatus(status) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    return memoryContacts
      .filter(c => c.status === status)
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
  }

  // Obtener por tipo
  static async getByType(type) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('contact_type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    return memoryContacts
      .filter(c => c.contact_type === type || c.type === type)
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
  }

  // Buscar contactos
  static async search(query) {
    const searchTerm = query.toLowerCase();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    return memoryContacts.filter(c =>
      c.name.toLowerCase().includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm) ||
      c.phone.includes(query)
    );
  }

  // Marcar como contactado
  static async markAsContacted(id) {
    return await this.update(id, { status: 'contacted' });
  }

  // Marcar como cerrado
  static async markAsClosed(id) {
    return await this.update(id, { status: 'closed' });
  }

  // Actualizar estado (generico)
  static async updateStatus(id, status, notes = null) {
    const updates = { status };
    if (notes) updates.notes = notes;
    return await this.update(id, updates);
  }

  // Contar contactos
  static async count(options = {}) {
    const { status = null, type = null } = options;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      if (status) query = query.eq('status', status);
      if (type) query = query.eq('contact_type', type);

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }

    let contacts = memoryContacts;
    if (status) contacts = contacts.filter(c => c.status === status);
    if (type) contacts = contacts.filter(c => c.contact_type === type || c.type === type);
    return contacts.length;
  }

  // Obtener estadisticas
  static async getStats() {
    if (isSupabaseConfigured()) {
      const [total, pending, contacted, closed, byType] = await Promise.all([
        this.count(),
        this.count({ status: 'pending' }),
        this.count({ status: 'contacted' }),
        this.count({ status: 'closed' }),
        Promise.all([
          this.count({ type: 'cliente' }),
          this.count({ type: 'hotel' }),
          this.count({ type: 'empresa' }),
          this.count({ type: 'escuela' })
        ])
      ]);

      return {
        total,
        pending,
        contacted,
        closed,
        byType: {
          cliente: byType[0],
          hotel: byType[1],
          empresa: byType[2],
          escuela: byType[3]
        }
      };
    }

    // Fallback en memoria
    const stats = {
      total: memoryContacts.length,
      pending: memoryContacts.filter(c => c.status === 'pending').length,
      contacted: memoryContacts.filter(c => c.status === 'contacted').length,
      closed: memoryContacts.filter(c => c.status === 'closed').length,
      byType: {
        cliente: memoryContacts.filter(c => (c.contact_type || c.type) === 'cliente').length,
        hotel: memoryContacts.filter(c => (c.contact_type || c.type) === 'hotel').length,
        empresa: memoryContacts.filter(c => (c.contact_type || c.type) === 'empresa').length,
        escuela: memoryContacts.filter(c => (c.contact_type || c.type) === 'escuela').length
      }
    };

    return stats;
  }

  // Obtener recientes
  static async getRecent(limit = 5) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }

    return memoryContacts
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
      .slice(0, limit);
  }
}

module.exports = Contact;
