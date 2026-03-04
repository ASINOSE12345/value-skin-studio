// Modelo de Promociones - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
let memoryPromotions = [];

// ============================================
// CLASE PROMOTION
// ============================================
class Promotion {
  // Obtener todas las promociones
  static async getAll(includeInactive = false) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let promotions = [...memoryPromotions];
    if (!includeInactive) {
      promotions = promotions.filter(p => p.active);
    }
    return promotions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Obtener promociones activas (vigentes)
  static async getActive() {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('promotions')
        .select('*')
        .eq('active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    const nowDate = new Date();
    return memoryPromotions.filter(p => {
      if (!p.active) return false;
      if (p.start_date && new Date(p.start_date) > nowDate) return false;
      if (p.end_date && new Date(p.end_date) < nowDate) return false;
      return true;
    });
  }

  // Obtener promocion por ID
  static async getById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryPromotions.find(p => p.id === id);
  }

  // Obtener promocion por codigo
  static async getByCode(code) {
    const upperCode = code.toUpperCase();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('promotions')
        .select('*')
        .eq('code', upperCode)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryPromotions.find(p => p.code && p.code.toUpperCase() === upperCode);
  }

  // Validar codigo de promocion
  static async validateCode(code, options = {}) {
    const { clientId = null, purchaseAmount = 0 } = options;

    const promotion = await this.getByCode(code);

    if (!promotion) {
      return { valid: false, message: 'Codigo de promocion no encontrado' };
    }

    if (!promotion.active) {
      return { valid: false, message: 'Esta promocion ya no esta activa' };
    }

    const now = new Date();

    if (promotion.start_date && new Date(promotion.start_date) > now) {
      return { valid: false, message: 'Esta promocion aun no ha comenzado' };
    }

    if (promotion.end_date && new Date(promotion.end_date) < now) {
      return { valid: false, message: 'Esta promocion ha expirado' };
    }

    if (promotion.max_uses && promotion.times_used >= promotion.max_uses) {
      return { valid: false, message: 'Esta promocion ha alcanzado el limite de usos' };
    }

    if (promotion.min_purchase && purchaseAmount < promotion.min_purchase) {
      return { valid: false, message: `Compra minima requerida: $${promotion.min_purchase}` };
    }

    // TODO: Verificar max_uses_per_client si clientId esta definido

    // Calcular descuento
    let discount = 0;
    if (promotion.discount_type === 'percentage') {
      discount = purchaseAmount * (promotion.discount_value / 100);
      if (promotion.max_discount && discount > promotion.max_discount) {
        discount = promotion.max_discount;
      }
    } else if (promotion.discount_type === 'fixed') {
      discount = promotion.discount_value;
    }

    return {
      valid: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        title: promotion.title,
        promoType: promotion.promo_type,
        discountType: promotion.discount_type,
        discountValue: promotion.discount_value,
        maxDiscount: promotion.max_discount
      },
      discount,
      finalAmount: purchaseAmount - discount
    };
  }

  // Crear promocion
  static async create(promoData) {
    const newPromotion = {
      name: promoData.name,
      title: promoData.title,
      description: promoData.description || null,
      promo_type: promoData.promoType || promoData.promo_type || 'percentage',
      discount_type: promoData.discountType || promoData.discount_type || 'percentage',
      discount_value: promoData.discountValue || promoData.discount_value || 0,
      max_discount: promoData.maxDiscount || promoData.max_discount || null,
      applies_to_type: promoData.appliesToType || promoData.applies_to_type || 'all',
      applies_to_items: promoData.appliesToItems || promoData.applies_to_items || [],
      min_purchase: promoData.minPurchase || promoData.min_purchase || null,
      max_uses: promoData.maxUses || promoData.max_uses || null,
      max_uses_per_client: promoData.maxUsesPerClient || promoData.max_uses_per_client || null,
      new_clients_only: promoData.newClientsOnly || promoData.new_clients_only || false,
      combinable: promoData.combinable || false,
      code: promoData.code ? promoData.code.toUpperCase() : null,
      auto_apply: promoData.autoApply || promoData.auto_apply || false,
      start_date: promoData.startDate || promoData.start_date || null,
      end_date: promoData.endDate || promoData.end_date || null,
      active: promoData.active !== undefined ? promoData.active : true,
      banner_image: promoData.bannerImage || promoData.banner_image || null,
      show_on_home: promoData.showOnHome || promoData.show_on_home || false,
      show_on_services: promoData.showOnServices || promoData.show_on_services || false,
      times_used: 0,
      total_discounted: 0
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('promotions')
        .insert(newPromotion)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryPromotion = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newPromotion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryPromotions.push(memoryPromotion);
    return memoryPromotion;
  }

  // Actualizar promocion
  static async update(id, updateData) {
    const updates = {};

    if (updateData.name !== undefined) updates.name = updateData.name;
    if (updateData.title !== undefined) updates.title = updateData.title;
    if (updateData.description !== undefined) updates.description = updateData.description;
    if (updateData.promoType !== undefined) updates.promo_type = updateData.promoType;
    if (updateData.promo_type !== undefined) updates.promo_type = updateData.promo_type;
    if (updateData.discountType !== undefined) updates.discount_type = updateData.discountType;
    if (updateData.discount_type !== undefined) updates.discount_type = updateData.discount_type;
    if (updateData.discountValue !== undefined) updates.discount_value = updateData.discountValue;
    if (updateData.discount_value !== undefined) updates.discount_value = updateData.discount_value;
    if (updateData.maxDiscount !== undefined) updates.max_discount = updateData.maxDiscount;
    if (updateData.max_discount !== undefined) updates.max_discount = updateData.max_discount;
    if (updateData.appliesToType !== undefined) updates.applies_to_type = updateData.appliesToType;
    if (updateData.appliesToItems !== undefined) updates.applies_to_items = updateData.appliesToItems;
    if (updateData.minPurchase !== undefined) updates.min_purchase = updateData.minPurchase;
    if (updateData.min_purchase !== undefined) updates.min_purchase = updateData.min_purchase;
    if (updateData.maxUses !== undefined) updates.max_uses = updateData.maxUses;
    if (updateData.max_uses !== undefined) updates.max_uses = updateData.max_uses;
    if (updateData.maxUsesPerClient !== undefined) updates.max_uses_per_client = updateData.maxUsesPerClient;
    if (updateData.newClientsOnly !== undefined) updates.new_clients_only = updateData.newClientsOnly;
    if (updateData.combinable !== undefined) updates.combinable = updateData.combinable;
    if (updateData.code !== undefined) updates.code = updateData.code ? updateData.code.toUpperCase() : null;
    if (updateData.autoApply !== undefined) updates.auto_apply = updateData.autoApply;
    if (updateData.startDate !== undefined) updates.start_date = updateData.startDate;
    if (updateData.start_date !== undefined) updates.start_date = updateData.start_date;
    if (updateData.endDate !== undefined) updates.end_date = updateData.endDate;
    if (updateData.end_date !== undefined) updates.end_date = updateData.end_date;
    if (updateData.active !== undefined) updates.active = updateData.active;
    if (updateData.bannerImage !== undefined) updates.banner_image = updateData.bannerImage;
    if (updateData.banner_image !== undefined) updates.banner_image = updateData.banner_image;
    if (updateData.showOnHome !== undefined) updates.show_on_home = updateData.showOnHome;
    if (updateData.show_on_home !== undefined) updates.show_on_home = updateData.show_on_home;
    if (updateData.showOnServices !== undefined) updates.show_on_services = updateData.showOnServices;
    if (updateData.show_on_services !== undefined) updates.show_on_services = updateData.show_on_services;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryPromotions.findIndex(p => p.id === id);
    if (index === -1) return null;

    memoryPromotions[index] = {
      ...memoryPromotions[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryPromotions[index];
  }

  // Eliminar promocion
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryPromotions.findIndex(p => p.id === id);
    if (index === -1) return false;

    memoryPromotions.splice(index, 1);
    return true;
  }

  // Incrementar uso de promocion
  static async incrementUsage(id, discountAmount = 0) {
    const promotion = await this.getById(id);
    if (!promotion) return null;

    const updates = {
      times_used: (promotion.times_used || 0) + 1,
      total_discounted: (promotion.total_discounted || 0) + discountAmount
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryPromotions.findIndex(p => p.id === id);
    if (index === -1) return null;

    memoryPromotions[index] = {
      ...memoryPromotions[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryPromotions[index];
  }

  // Obtener estadisticas de promocion
  static async getStats(id) {
    const promotion = await this.getById(id);
    if (!promotion) return null;

    return {
      timesUsed: promotion.times_used || 0,
      totalDiscounted: promotion.total_discounted || 0,
      averageDiscount: promotion.times_used > 0
        ? (promotion.total_discounted / promotion.times_used).toFixed(2)
        : 0,
      remainingUses: promotion.max_uses
        ? promotion.max_uses - (promotion.times_used || 0)
        : 'Ilimitado',
      isExpired: promotion.end_date && new Date(promotion.end_date) < new Date(),
      daysRemaining: promotion.end_date
        ? Math.ceil((new Date(promotion.end_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null
    };
  }

  // Toggle activo/inactivo
  static async toggleActive(id) {
    const promotion = await this.getById(id);
    if (!promotion) return null;

    return await this.update(id, { active: !promotion.active });
  }

  // Contar promociones
  static async count(activeOnly = false) {
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('promotions')
        .select('*', { count: 'exact', head: true });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }

    if (activeOnly) {
      return memoryPromotions.filter(p => p.active).length;
    }
    return memoryPromotions.length;
  }

  // Obtener promociones para mostrar en home
  static async getHomePromotions() {
    if (isSupabaseConfigured()) {
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('promotions')
        .select('*')
        .eq('active', true)
        .eq('show_on_home', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    const now = new Date();
    return memoryPromotions.filter(p => {
      if (!p.active || !p.show_on_home) return false;
      if (p.start_date && new Date(p.start_date) > now) return false;
      if (p.end_date && new Date(p.end_date) < now) return false;
      return true;
    });
  }

  // Obtener solo promociones activas (alias de getAll con activeOnly=true)
  static async getActive() {
    return this.getAll(true);
  }
}

module.exports = Promotion;
