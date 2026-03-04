// Modelo de Facturas/Recibos - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Almacenamiento en memoria (fallback)
let memoryInvoices = [];
let memoryInvoiceItems = [];
let invoiceIdCounter = 1;
let invoiceNumberCounter = 1;

class Invoice {
  // Generar número de factura
  static generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const num = String(invoiceNumberCounter++).padStart(4, '0');
    return `VSS-${year}-${num}`;
  }

  // Obtener todas las facturas
  static async getAll(options = {}) {
    const { page = 1, limit = 50, status = null, type = null, clientId = null } = options;
    const offset = (page - 1) * limit;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('invoices')
        .select(`
          *,
          client:clients(id, first_name, last_name, email, phone),
          items:invoice_items(*)
        `, { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);
      if (clientId) query = query.eq('client_id', clientId);

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data,
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
      };
    }

    // Fallback en memoria
    let invoices = [...memoryInvoices];
    if (status) invoices = invoices.filter(i => i.status === status);
    if (type) invoices = invoices.filter(i => i.type === type);
    if (clientId) invoices = invoices.filter(i => i.client_id === clientId);

    invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = invoices.length;
    const paginatedInvoices = invoices.slice(offset, offset + limit);

    return {
      data: paginatedInvoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  // Obtener factura por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          client:clients(id, first_name, last_name, email, phone, address),
          appointment:appointments(id, appointment_date, appointment_time, service_name),
          items:invoice_items(*)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    const invoice = memoryInvoices.find(i => i.id === id);
    if (invoice) {
      invoice.items = memoryInvoiceItems.filter(item => item.invoice_id === id);
    }
    return invoice;
  }

  // Crear factura
  static async create(invoiceData) {
    const newInvoice = {
      client_id: invoiceData.clientId || invoiceData.client_id,
      appointment_id: invoiceData.appointmentId || invoiceData.appointment_id || null,
      type: invoiceData.type || 'receipt',
      status: invoiceData.status || 'draft',
      issue_date: invoiceData.issueDate || invoiceData.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoiceData.dueDate || invoiceData.due_date || null,
      subtotal: invoiceData.subtotal || 0,
      discount_amount: invoiceData.discountAmount || invoiceData.discount_amount || 0,
      tax_rate: invoiceData.taxRate || invoiceData.tax_rate || 0,
      tax_amount: invoiceData.taxAmount || invoiceData.tax_amount || 0,
      total: invoiceData.total || 0,
      notes: invoiceData.notes || null,
      payment_method: invoiceData.paymentMethod || invoiceData.payment_method || null,
      created_by: invoiceData.createdBy || invoiceData.created_by || null
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .insert(newInvoice)
        .select(`
          *,
          client:clients(id, first_name, last_name, email, phone)
        `)
        .single();

      if (error) throw error;

      // Crear items si existen
      if (invoiceData.items && invoiceData.items.length > 0) {
        const items = invoiceData.items.map(item => ({
          invoice_id: data.id,
          service_id: item.serviceId || item.service_id || null,
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || item.unit_price,
          discount_percent: item.discountPercent || item.discount_percent || 0,
          total: item.total
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return data;
    }

    // Fallback en memoria
    const memoryInvoice = {
      id: `inv-${invoiceIdCounter++}`,
      invoice_number: this.generateInvoiceNumber(),
      ...newInvoice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryInvoices.push(memoryInvoice);

    // Crear items
    if (invoiceData.items) {
      invoiceData.items.forEach(item => {
        memoryInvoiceItems.push({
          id: `item-${Date.now()}-${Math.random()}`,
          invoice_id: memoryInvoice.id,
          ...item,
          created_at: new Date().toISOString()
        });
      });
    }

    return memoryInvoice;
  }

  // Actualizar factura
  static async update(id, updateData) {
    const updates = {};

    if (updateData.status !== undefined) updates.status = updateData.status;
    if (updateData.notes !== undefined) updates.notes = updateData.notes;
    if (updateData.paymentMethod !== undefined) updates.payment_method = updateData.paymentMethod;
    if (updateData.payment_method !== undefined) updates.payment_method = updateData.payment_method;
    if (updateData.paidAt !== undefined) updates.paid_at = updateData.paidAt;
    if (updateData.paid_at !== undefined) updates.paid_at = updateData.paid_at;
    if (updateData.subtotal !== undefined) updates.subtotal = updateData.subtotal;
    if (updateData.discountAmount !== undefined) updates.discount_amount = updateData.discountAmount;
    if (updateData.taxAmount !== undefined) updates.tax_amount = updateData.taxAmount;
    if (updateData.total !== undefined) updates.total = updateData.total;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const index = memoryInvoices.findIndex(i => i.id === id);
    if (index === -1) return null;

    memoryInvoices[index] = {
      ...memoryInvoices[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryInvoices[index];
  }

  // Marcar como pagada
  static async markAsPaid(id, paymentMethod = null) {
    return this.update(id, {
      status: 'paid',
      payment_method: paymentMethod,
      paid_at: new Date().toISOString()
    });
  }

  // Eliminar factura
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryInvoices.findIndex(i => i.id === id);
    if (index === -1) return false;

    memoryInvoices.splice(index, 1);
    memoryInvoiceItems = memoryInvoiceItems.filter(item => item.invoice_id !== id);
    return true;
  }

  // Obtener estadísticas
  static async getStats() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('status, total');

      if (error) throw error;

      const stats = {
        total: data.length,
        draft: 0,
        sent: 0,
        paid: 0,
        cancelled: 0,
        totalRevenue: 0,
        pendingRevenue: 0
      };

      data.forEach(inv => {
        stats[inv.status] = (stats[inv.status] || 0) + 1;
        if (inv.status === 'paid') {
          stats.totalRevenue += parseFloat(inv.total) || 0;
        } else if (inv.status === 'sent') {
          stats.pendingRevenue += parseFloat(inv.total) || 0;
        }
      });

      return stats;
    }

    // Fallback en memoria
    const stats = {
      total: memoryInvoices.length,
      draft: memoryInvoices.filter(i => i.status === 'draft').length,
      sent: memoryInvoices.filter(i => i.status === 'sent').length,
      paid: memoryInvoices.filter(i => i.status === 'paid').length,
      cancelled: memoryInvoices.filter(i => i.status === 'cancelled').length,
      totalRevenue: memoryInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0),
      pendingRevenue: memoryInvoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)
    };

    return stats;
  }

  // Obtener facturas por cliente
  static async getByClient(clientId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    return memoryInvoices.filter(i => i.client_id === clientId);
  }

  // Contar facturas
  static async count(options = {}) {
    const { status = null, type = null } = options;

    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }

    let invoices = memoryInvoices;
    if (status) invoices = invoices.filter(i => i.status === status);
    if (type) invoices = invoices.filter(i => i.type === type);
    return invoices.length;
  }
}

module.exports = Invoice;
