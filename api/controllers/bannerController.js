// Controlador de Banners
const Banner = require('../models/Banner');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { getPublicIdFromUrl, deleteImage } = require('../config/cloudinary');

// =====================================================
// CONTROLADORES PUBLICOS
// =====================================================

// Obtener banners activos por seccion
const getBannersBySection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const validSections = ['hero', 'cta', 'features', 'promo', 'popup'];

  if (!validSections.includes(section)) {
    throw createError.badRequest(`Seccion invalida. Debe ser: ${validSections.join(', ')}`);
  }

  const banners = await Banner.getBySection(section);

  res.json({
    success: true,
    data: banners
  });
});

// Obtener banner activo para hero
const getHeroBanner = asyncHandler(async (req, res) => {
  const banners = await Banner.getBySection('hero');
  const activeBanner = banners.length > 0 ? banners[0] : null;

  res.json({
    success: true,
    data: activeBanner
  });
});

// Obtener todos los banners activos
const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.getActive();

  res.json({
    success: true,
    data: banners
  });
});

// =====================================================
// CONTROLADORES ADMIN
// =====================================================

// Obtener todos los banners (admin)
const getAllBanners = asyncHandler(async (req, res) => {
  const { section } = req.query;

  let banners;
  if (section) {
    banners = await Banner.getBySection(section, true);
  } else {
    banners = await Banner.getAll();
  }

  res.json({
    success: true,
    count: banners.length,
    data: banners
  });
});

// Obtener banner por ID
const getBannerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.getById(id);

  if (!banner) {
    throw createError.notFound('Banner no encontrado');
  }

  res.json({
    success: true,
    data: banner
  });
});

// Crear banner
const createBanner = asyncHandler(async (req, res) => {
  const bannerData = {
    title: req.body.title,
    subtitle: req.body.subtitle,
    description: req.body.description,
    section: req.body.section,
    ctaText: req.body.ctaText,
    ctaLink: req.body.ctaLink,
    ctaSecondaryText: req.body.ctaSecondaryText,
    ctaSecondaryLink: req.body.ctaSecondaryLink,
    displayOrder: req.body.displayOrder,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    active: req.body.active
  };

  // Si hay archivo de imagen
  if (req.file) {
    bannerData.imageUrl = req.file.path || req.file.location;
    bannerData.imageAlt = req.body.imageAlt || req.body.title;
  } else if (req.body.imageUrl) {
    bannerData.imageUrl = req.body.imageUrl;
    bannerData.imageAlt = req.body.imageAlt;
  }

  // Overlay settings
  if (req.body.overlayColor) bannerData.overlayColor = req.body.overlayColor;
  if (req.body.overlayOpacity) bannerData.overlayOpacity = parseFloat(req.body.overlayOpacity);
  if (req.body.textColor) bannerData.textColor = req.body.textColor;
  if (req.body.textAlign) bannerData.textAlign = req.body.textAlign;

  // Mobile image
  if (req.body.mobileImageUrl) bannerData.mobileImageUrl = req.body.mobileImageUrl;

  const banner = await Banner.create(bannerData);

  res.status(201).json({
    success: true,
    message: 'Banner creado correctamente',
    data: banner
  });
});

// Actualizar banner
const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingBanner = await Banner.getById(id);
  if (!existingBanner) {
    throw createError.notFound('Banner no encontrado');
  }

  const updateData = { ...req.body };

  // Si hay nuevo archivo de imagen, eliminar el anterior de Cloudinary
  if (req.file) {
    if (existingBanner.image_url) {
      const publicId = getPublicIdFromUrl(existingBanner.image_url);
      if (publicId) {
        try {
          await deleteImage(publicId);
        } catch (err) {
          console.error('Error eliminando imagen anterior:', err);
        }
      }
    }
    updateData.imageUrl = req.file.path || req.file.location;
  }

  const banner = await Banner.update(id, updateData);

  res.json({
    success: true,
    message: 'Banner actualizado correctamente',
    data: banner
  });
});

// Eliminar banner
const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const banner = await Banner.getById(id);
  if (!banner) {
    throw createError.notFound('Banner no encontrado');
  }

  // Eliminar imagen de Cloudinary si existe
  if (banner.image_url) {
    const publicId = getPublicIdFromUrl(banner.image_url);
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (err) {
        console.error('Error eliminando imagen:', err);
      }
    }
  }

  await Banner.delete(id);

  res.json({
    success: true,
    message: 'Banner eliminado correctamente'
  });
});

// Toggle activo/inactivo
const toggleBannerActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const banner = await Banner.toggleActive(id);
  if (!banner) {
    throw createError.notFound('Banner no encontrado');
  }

  res.json({
    success: true,
    message: `Banner ${banner.active ? 'activado' : 'desactivado'} correctamente`,
    data: banner
  });
});

// Reordenar banners
const reorderBanners = asyncHandler(async (req, res) => {
  const { section, order } = req.body;

  if (!section || !order || !Array.isArray(order)) {
    throw createError.badRequest('Se requiere section y order (array de IDs)');
  }

  await Banner.reorder(section, order);

  res.json({
    success: true,
    message: 'Orden de banners actualizado'
  });
});

// Duplicar banner
const duplicateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const original = await Banner.getById(id);
  if (!original) {
    throw createError.notFound('Banner no encontrado');
  }

  const duplicateData = {
    title: `${original.title} (copia)`,
    subtitle: original.subtitle,
    description: original.description,
    section: original.section,
    imageUrl: original.image_url,
    imageAlt: original.image_alt,
    ctaText: original.cta_text,
    ctaLink: original.cta_link,
    ctaSecondaryText: original.cta_secondary_text,
    ctaSecondaryLink: original.cta_secondary_link,
    overlayColor: original.overlay_color,
    overlayOpacity: original.overlay_opacity,
    textColor: original.text_color,
    textAlign: original.text_align,
    active: false // Duplicado inactivo por defecto
  };

  const newBanner = await Banner.create(duplicateData);

  res.status(201).json({
    success: true,
    message: 'Banner duplicado correctamente',
    data: newBanner
  });
});

// Subir imagen de banner
const uploadBannerImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError.badRequest('No se proporciono imagen');
  }

  res.json({
    success: true,
    message: 'Imagen subida correctamente',
    data: {
      url: req.file.path || req.file.location,
      filename: req.file.filename || req.file.originalname
    }
  });
});

module.exports = {
  // Publicos
  getBannersBySection,
  getHeroBanner,
  getActiveBanners,
  // Admin
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  reorderBanners,
  duplicateBanner,
  uploadBannerImage
};
