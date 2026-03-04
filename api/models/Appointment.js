// Modelo de Turnos/Citas - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
let memoryAppointments = [];
let appointmentIdCounter = 1;

// ============================================
// CLASE APPOINTMENT
// ============================================
class Appointment {
  // Obtener todos los turnos
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      status = null,
      date = null,
      sort = 'created_at',
      order = 'desc'
    } = options;

    const offset = (page - 1) * limit;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (date) query = query.eq('appointment_date', date);

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
    let appointments = [...memoryAppointments];

    if (status) appointments = appointments.filter(a => a.status === status);
    if (date) appointments = appointments.filter(a => a.date === date || a.appointment_date === date);

    appointments.sort((a, b) => {
      const aVal = a[sort] || a.createdAt || '';
      const bVal = b[sort] || b.createdAt || '';
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    const total = appointments.length;
    const paginatedAppointments = appointments.slice(offset, offset + limit);

    return {
      data: paginatedAppointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Obtener turno por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryAppointments.find(a => a.id === id || a.id === parseInt(id));
  }

  // Crear turno
  static async create(appointmentData) {
    const newAppointment = {
      client_name: appointmentData.clientName || appointmentData.client_name,
      client_email: appointmentData.clientEmail || appointmentData.client_email || 'sin-email@placeholder.com',
      client_phone: appointmentData.clientPhone || appointmentData.client_phone,
      service_id: appointmentData.serviceId || appointmentData.service_id || null,
      service_name: appointmentData.service || appointmentData.service_name,
      program: appointmentData.program || null,
      appointment_date: appointmentData.date || appointmentData.appointment_date,
      appointment_time: appointmentData.time || appointmentData.appointment_time,
      status: appointmentData.status || 'pending',
      notes: appointmentData.notes || null,
      client_id: appointmentData.clientId || appointmentData.client_id || null
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .insert(newAppointment)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryAppointment = {
      id: appointmentIdCounter++,
      ...newAppointment,
      // Compatibilidad con formato anterior
      clientName: newAppointment.client_name,
      clientEmail: newAppointment.client_email,
      clientPhone: newAppointment.client_phone,
      service: newAppointment.service_name,
      date: newAppointment.appointment_date,
      time: newAppointment.appointment_time,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryAppointments.push(memoryAppointment);
    return memoryAppointment;
  }

  // Actualizar turno
  static async update(id, updateData) {
    const updates = {};

    if (updateData.clientName !== undefined) updates.client_name = updateData.clientName;
    if (updateData.client_name !== undefined) updates.client_name = updateData.client_name;
    if (updateData.clientEmail !== undefined) updates.client_email = updateData.clientEmail;
    if (updateData.client_email !== undefined) updates.client_email = updateData.client_email;
    if (updateData.clientPhone !== undefined) updates.client_phone = updateData.clientPhone;
    if (updateData.client_phone !== undefined) updates.client_phone = updateData.client_phone;
    if (updateData.serviceId !== undefined) updates.service_id = updateData.serviceId;
    if (updateData.service !== undefined) updates.service_name = updateData.service;
    if (updateData.service_name !== undefined) updates.service_name = updateData.service_name;
    if (updateData.program !== undefined) updates.program = updateData.program;
    if (updateData.date !== undefined) updates.appointment_date = updateData.date;
    if (updateData.appointment_date !== undefined) updates.appointment_date = updateData.appointment_date;
    if (updateData.time !== undefined) updates.appointment_time = updateData.time;
    if (updateData.appointment_time !== undefined) updates.appointment_time = updateData.appointment_time;
    if (updateData.status !== undefined) updates.status = updateData.status;
    if (updateData.notes !== undefined) updates.notes = updateData.notes;
    if (updateData.clientId !== undefined) updates.client_id = updateData.clientId;
    if (updateData.client_id !== undefined) updates.client_id = updateData.client_id;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryAppointments.findIndex(a => a.id === id || a.id === parseInt(id));
    if (index === -1) return null;

    memoryAppointments[index] = {
      ...memoryAppointments[index],
      ...updates,
      // Compatibilidad
      clientName: updates.client_name || memoryAppointments[index].clientName,
      clientEmail: updates.client_email || memoryAppointments[index].clientEmail,
      clientPhone: updates.client_phone || memoryAppointments[index].clientPhone,
      service: updates.service_name || memoryAppointments[index].service,
      date: updates.appointment_date || memoryAppointments[index].date,
      time: updates.appointment_time || memoryAppointments[index].time,
      updated_at: new Date().toISOString(),
      updatedAt: new Date()
    };

    return memoryAppointments[index];
  }

  // Eliminar turno
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryAppointments.findIndex(a => a.id === id || a.id === parseInt(id));
    if (index === -1) return false;

    memoryAppointments.splice(index, 1);
    return true;
  }

  // Obtener por estado
  static async getByStatus(status) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('status', status)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    }

    return memoryAppointments.filter(a => a.status === status);
  }

  // Obtener por fecha
  static async getByDate(date) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('appointment_date', date)
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data;
    }

    return memoryAppointments.filter(a => a.date === date || a.appointment_date === date);
  }

  // Obtener proximos turnos
  static async getUpcoming(limit = 10) {
    const today = new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .gte('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    }

    const now = new Date();
    return memoryAppointments
      .filter(a => {
        const appointmentDate = new Date((a.date || a.appointment_date) + 'T' + (a.time || a.appointment_time));
        return appointmentDate >= now && a.status !== 'cancelled';
      })
      .sort((a, b) => {
        const dateA = new Date((a.date || a.appointment_date) + 'T' + (a.time || a.appointment_time));
        const dateB = new Date((b.date || b.appointment_date) + 'T' + (b.time || b.appointment_time));
        return dateA - dateB;
      })
      .slice(0, limit);
  }

  // Buscar turnos
  static async search(query) {
    const searchTerm = query.toLowerCase();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,client_phone.ilike.%${searchTerm}%,service_name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    return memoryAppointments.filter(a =>
      (a.clientName || a.client_name).toLowerCase().includes(searchTerm) ||
      (a.clientEmail || a.client_email).toLowerCase().includes(searchTerm) ||
      (a.clientPhone || a.client_phone).includes(query) ||
      (a.service || a.service_name).toLowerCase().includes(searchTerm)
    );
  }

  // Confirmar turno
  static async confirm(id) {
    return await this.update(id, { status: 'confirmed' });
  }

  // Completar turno
  static async complete(id) {
    return await this.update(id, { status: 'completed' });
  }

  // Cancelar turno
  static async cancel(id) {
    return await this.update(id, { status: 'cancelled' });
  }

  // Contar turnos
  static async count(options = {}) {
    const { status = null, date = null } = options;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      if (status) query = query.eq('status', status);
      if (date) query = query.eq('appointment_date', date);

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }

    let appointments = memoryAppointments;
    if (status) appointments = appointments.filter(a => a.status === status);
    if (date) appointments = appointments.filter(a => (a.date || a.appointment_date) === date);
    return appointments.length;
  }

  // Obtener estadisticas
  static async getStats() {
    if (isSupabaseConfigured()) {
      const today = new Date().toISOString().split('T')[0];

      const [total, pending, confirmed, completed, cancelled, upcoming] = await Promise.all([
        this.count(),
        this.count({ status: 'pending' }),
        this.count({ status: 'confirmed' }),
        this.count({ status: 'completed' }),
        this.count({ status: 'cancelled' }),
        supabaseAdmin
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('appointment_date', today)
          .neq('status', 'cancelled')
      ]);

      return {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        upcoming: upcoming.count || 0
      };
    }

    // Fallback en memoria
    const now = new Date();
    const stats = {
      total: memoryAppointments.length,
      pending: memoryAppointments.filter(a => a.status === 'pending').length,
      confirmed: memoryAppointments.filter(a => a.status === 'confirmed').length,
      completed: memoryAppointments.filter(a => a.status === 'completed').length,
      cancelled: memoryAppointments.filter(a => a.status === 'cancelled').length,
      upcoming: memoryAppointments.filter(a => {
        const appointmentDate = new Date((a.date || a.appointment_date) + 'T' + (a.time || a.appointment_time));
        return appointmentDate >= now && a.status !== 'cancelled';
      }).length
    };

    return stats;
  }

  // Obtener recientes
  static async getRecent(limit = 5) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }

    return memoryAppointments
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
      .slice(0, limit);
  }

  // Verificar disponibilidad
  static async checkAvailability(date, time) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .neq('status', 'cancelled');

      if (error) throw error;
      return data.length === 0;
    }

    const existing = memoryAppointments.find(a =>
      (a.date === date || a.appointment_date === date) &&
      (a.time === time || a.appointment_time === time) &&
      a.status !== 'cancelled'
    );

    return !existing;
  }
}

module.exports = Appointment;
