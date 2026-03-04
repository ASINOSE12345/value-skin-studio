// Controlador de Promociones
const Promotion = require('../models/Promotion');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { getPublicIdFromUrl, deleteImage } = require('../config/cloudinary');

// =====================================================
// CONTROLADORES PUBLICOS
// =====================================================

// Obtener promociones activas
const getActivePromotions = asyncHandler(async (req, res) => {
  const promotions = await Promotion.getActive();

  res.json({
    success: true,
    count: promotions.length,
    data: promotions
  });
});

// Obtener promociones para home
const getHomePromotions = asyncHandler(async (req, res) => {
  const promotions = await Promotion.getHomePromotions();

  res.json({
    success: true,
    count: promotions.length,
    data: promotions
  });
});

// Validar codigo de promocion
const validatePromoCode = asyncHandler(async (req, res) => {
  const { code, purchaseAmount = 0, clientId } = req.body;

  if (!code) {
    throw createError.badRequest('Se requiere el codigo de promocion');
  }

  const result = await Promotion.validateCode(code, {
    purchaseAmount: parseFloat(purchaseAmount),
    clientId
  });

  res.json({
    success: result.valid,
    message: result.message,
    data: result.valid ? {
      promotion: result.promotion,
      discount: result.discount,
      finalAmount: result.finalAmount
    } : null
  });
});

// Obtener promocion por codigo (info publica)
const getPromotionByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const promotion = await Promotion.getByCode(code);

  if (!promotion || !promotion.active) {
    throw createError.notFound('Promocion no encontrada');
  }

  // Devolver solo info publica
  res.json({
    success: true,
    data: {
      name: promotion.name,
      title: promotion.title,
      description: promotion.description,
      discountType: promotion.discount_type,
      discountValue: promotion.discount_value,
      minPurchase: promotion.min_purchase,
      endDate: promotion.end_date,
      bannerImage: promotion.banner_image
    }
  });
});

// =====================================================
// CONTROLADORES ADMIN
// =====================================================

// Obtener todas las promociones
const getAllPromotions = asyncHandler(async (req, res) => {
  const { active } = req.query;
  const includeInactive = active !== 'true';

  const promotions = await Promotion.getAll(includeInactive);

  res.json({
    success: true,
    count: promotions.length,
    data: promotions
  });
});

// Obtener promocion por ID
const getPromotionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const promotion = await Promotion.getById(id);

  if (!promotion) {
    throw createError.notFound('Promocion no encontrada');
  }

  res.json({
    success: true,
    data: promotion
  });
});

// Crear promocion
const createPromotion = asyncHandler(async (req, res) => {
  const promoData = {
    name: req.body.name,
    title: req.body.title,
    description: req.body.description,
    promoType: req.body.promoType,
    discountType: req.body.discountType,
    discountValue: req.body.discountValue,
    maxDiscount: req.body.maxDiscount,
    appliesToType: req.body.appliesToType,
    appliesToItems: req.body.appliesToItems,
    minPurchase: req.body.minPurchase,
    maxUses: req.body.maxUses,
    maxUsesPerClient: req.body.maxUsesPerClient,
    newClientsOnly: req.body.newClientsOnly,
    combinable: req.body.combinable,
    code: req.body.code,
    autoApply: req.body.autoApply,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    showOnHome: req.body.showOnHome,
    showOnServices: req.body.showOnServices,
    active: req.body.active
  };

  // Si hay archivo de banner
  if (req.file) {
    promoData.bannerImage = req.file.path || req.file.location;
  } else if (req.body.bannerImage) {
    promoData.bannerImage = req.body.bannerImage;
  }

  // Parsear arrays si vienen como string
  if (promoData.appliesToItems && typeof promoData.appliesToItems === 'string') {
    promoData.appliesToItems = JSON.parse(promoData.appliesToItems);
  }

  // Verificar codigo unico si existe
  if (promoData.code) {
    const existing = await Promotion.getByCode(promoData.code);
    if (existing) {
      throw createError.conflict('Ya existe una promocion con ese codigo');
    }
  }

  const promotion = await Promotion.create(promoData);

  res.status(201).json({
    success: true,
    message: 'Promocion creada correctamente',
    data: promotion
  });
});

// Actualizar promocion
const updatePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingPromo = await Promotion.getById(id);
  if (!existingPromo) {
    throw createError.notFound('Promocion no encontrada');
  }

  const updateData = { ...req.body };

  // Parsear arrays si vienen como string
  if (updateData.appliesToItems && typeof updateData.appliesToItems === 'string') {
    updateData.appliesToItems = JSON.parse(updateData.appliesToItems);
  }

  // Si hay nuevo archivo de banner
  if (req.file) {
    if (existingPromo.banner_image) {
      const publicId = getPublicIdFromUrl(existingPromo.banner_image);
      if (publicId) {
        try {
          await deleteImage(publicId);
        } catch (err) {
          console.error('Error eliminando banner anterior:', err);
        }
      }
    }
    updateData.bannerImage = req.file.path || req.file.location;
  }

  // Verificar codigo unico si se esta cambiando
  if (updateData.code && updateData.code !== existingPromo.code) {
    const codeExists = await Promotion.getByCode(updateData.code);
    if (codeExists) {
      throw createError.conflict('Ya existe una promocion con ese codigo');
    }
  }

  const promotion = await Promotion.update(id, updateData);

  res.json({
    success: true,
    message: 'Promocion actualizada correctamente',
    data: promotion
  });
});

// Eliminar promocion
const deletePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await Promotion.getById(id);
  if (!promotion) {
    throw createError.notFound('Promocion no encontrada');
  }

  // Eliminar banner de Cloudinary si existe
  if (promotion.banner_image) {
    const publicId = getPublicIdFromUrl(promotion.banner_image);
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (err) {
        console.error('Error eliminando banner:', err);
      }
    }
  }

  await Promotion.delete(id);

  res.json({
    success: true,
    message: 'Promocion eliminada correctamente'
  });
});

// Toggle activo/inactivo
const togglePromotionActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await Promotion.toggleActive(id);
  if (!promotion) {
    throw createError.notFound('Promocion no encontrada');
  }

  res.json({
    success: true,
    message: `Promocion ${promotion.active ? 'activada' : 'desactivada'} correctamente`,
    data: promotion
  });
});

// Incrementar uso de promocion
const incrementPromotionUsage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { discountAmount = 0 } = req.body;

  const promotion = await Promotion.incrementUsage(id, parseFloat(discountAmount));
  if (!promotion) {
    throw createError.notFound('Promocion no encontrada');
  }

  res.json({
    success: true,
    message: 'Uso de promocion registrado',
    data: promotion
  });
});

// Obtener estadisticas de promocion
const getPromotionStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stats = await Promotion.getStats(id);
  if (!stats) {
    throw createError.notFound('Promocion no encontrada');
  }

  res.json({
    success: true,
    data: stats
  });
});

// Duplicar promocion
const duplicatePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const original = await Promotion.getById(id);
  if (!original) {
    throw createError.notFound('Promocion no encontrada');
  }

  const duplicateData = {
    name: `${original.name} (copia)`,
    title: original.title,
    description: original.description,
    promoType: original.promo_type,
    discountType: original.discount_type,
    discountValue: original.discount_value,
    maxDiscount: original.max_discount,
    appliesToType: original.applies_to_type,
    appliesToItems: original.applies_to_items,
    minPurchase: original.min_purchase,
    maxUses: original.max_uses,
    maxUsesPerClient: original.max_uses_per_client,
    newClientsOnly: original.new_clients_only,
    combinable: original.combinable,
    code: original.code ? `${original.code}_COPY` : null,
    autoApply: original.auto_apply,
    bannerImage: original.banner_image,
    showOnHome: false,
    showOnServices: false,
    active: false
  };

  const newPromotion = await Promotion.create(duplicateData);

  res.status(201).json({
    success: true,
    message: 'Promocion duplicada correctamente',
    data: newPromotion
  });
});

// Obtener resumen de todas las promociones
const getPromotionsSummary = asyncHandler(async (req, res) => {
  const total = await Promotion.count();
  const active = await Promotion.count(true);
  const promotions = await Promotion.getAll(true);

  // Calcular totales
  let totalUsage = 0;
  let totalDiscounted = 0;

  promotions.forEach(p => {
    totalUsage += p.times_used || 0;
    totalDiscounted += p.total_discounted || 0;
  });

  // Promociones por expirar (7 dias)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = promotions.filter(p => {
    if (!p.end_date) return false;
    const endDate = new Date(p.end_date);
    return endDate > now && endDate < nextWeek;
  }).length;

  res.json({
    success: true,
    data: {
      total,
      active,
      inactive: total - active,
      expiringSoon,
      totalUsage,
      totalDiscounted
    }
  });
});

// Subir banner de promocion
const uploadPromoBanner = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError.badRequest('No se proporciono imagen');
  }

  res.json({
    success: true,
    message: 'Banner subido correctamente',
    data: {
      url: req.file.path || req.file.location,
      filename: req.file.filename || req.file.originalname
    }
  });
});

module.exports = {
  // Publicos
  getActivePromotions,
  getHomePromotions,
  validatePromoCode,
  getPromotionByCode,
  // Admin
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionActive,
  incrementPromotionUsage,
  getPromotionStats,
  duplicatePromotion,
  getPromotionsSummary,
  uploadPromoBanner
};
