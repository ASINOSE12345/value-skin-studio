// Modelo de Configuración del Negocio - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Configuración por defecto en memoria
let memoryBusinessConfig = {
  id: '00000000-0000-0000-0000-000000000001',
  business_name: 'Value Skin Studio',
  legal_name: null,
  tax_id: null,
  tax_rate: 0,
  currency: 'ARS',
  currency_symbol: '$',
  invoice_prefix: 'VSS',
  invoice_next_number: 1,
  invoice_terms: 'Pago al contado. No se aceptan devoluciones.',
  invoice_footer: 'Gracias por su preferencia.',
  appointment_buffer_minutes: 15,
  appointment_default_duration: 60,
  allow_online_booking: true,
  require_deposit: false,
  deposit_percentage: 0,
  cancellation_policy: 'Cancelaciones deben realizarse con al menos 24 horas de anticipación.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

class BusinessConfig {
  // Obtener configuración
  static async get() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('business_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        return await this.create({});
      }

      return data;
    }

    return memoryBusinessConfig;
  }

  // Crear configuración
  static async create(configData) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('business_config')
        .insert({
          business_name: configData.businessName || configData.business_name || 'Value Skin Studio',
          legal_name: configData.legalName || configData.legal_name || null,
          tax_id: configData.taxId || configData.tax_id || null,
          tax_rate: configData.taxRate || configData.tax_rate || 0,
          currency: configData.currency || 'ARS',
          currency_symbol: configData.currencySymbol || configData.currency_symbol || '$',
          invoice_prefix: configData.invoicePrefix || configData.invoice_prefix || 'VSS',
          invoice_next_number: configData.invoiceNextNumber || configData.invoice_next_number || 1,
          invoice_terms: configData.invoiceTerms || configData.invoice_terms || null,
          invoice_footer: configData.invoiceFooter || configData.invoice_footer || null,
          appointment_buffer_minutes: configData.appointmentBufferMinutes || configData.appointment_buffer_minutes || 15,
          appointment_default_duration: configData.appointmentDefaultDuration || configData.appointment_default_duration || 60,
          allow_online_booking: configData.allowOnlineBooking ?? configData.allow_online_booking ?? true,
          require_deposit: configData.requireDeposit ?? configData.require_deposit ?? false,
          deposit_percentage: configData.depositPercentage || configData.deposit_percentage || 0,
          cancellation_policy: configData.cancellationPolicy || configData.cancellation_policy || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    memoryBusinessConfig = {
      ...memoryBusinessConfig,
      ...configData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return memoryBusinessConfig;
  }

  // Actualizar configuración
  static async update(updateData) {
    const updates = {};

    // Mapear camelCase a snake_case
    const fieldMap = {
      businessName: 'business_name',
      legalName: 'legal_name',
      taxId: 'tax_id',
      taxRate: 'tax_rate',
      currency: 'currency',
      currencySymbol: 'currency_symbol',
      invoicePrefix: 'invoice_prefix',
      invoiceNextNumber: 'invoice_next_number',
      invoiceTerms: 'invoice_terms',
      invoiceFooter: 'invoice_footer',
      appointmentBufferMinutes: 'appointment_buffer_minutes',
      appointmentDefaultDuration: 'appointment_default_duration',
      allowOnlineBooking: 'allow_online_booking',
      requireDeposit: 'require_deposit',
      depositPercentage: 'deposit_percentage',
      cancellationPolicy: 'cancellation_policy'
    };

    Object.keys(updateData).forEach(key => {
      const snakeKey = fieldMap[key] || key;
      if (updateData[key] !== undefined) {
        updates[snakeKey] = updateData[key];
      }
    });

    if (isSupabaseConfigured()) {
      const current = await this.get();

      const { data, error } = await supabaseAdmin
        .from('business_config')
        .update(updates)
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    memoryBusinessConfig = {
      ...memoryBusinessConfig,
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryBusinessConfig;
  }

  // Obtener siguiente número de factura
  static async getNextInvoiceNumber() {
    const config = await this.get();
    const year = new Date().getFullYear();
    const num = String(config.invoice_next_number).padStart(4, '0');
    return `${config.invoice_prefix}-${year}-${num}`;
  }

  // Incrementar número de factura
  static async incrementInvoiceNumber() {
    const config = await this.get();
    return this.update({ invoice_next_number: config.invoice_next_number + 1 });
  }
}

module.exports = BusinessConfig;
