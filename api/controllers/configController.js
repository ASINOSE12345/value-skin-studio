// Controlador de Configuracion del Sitio
const SiteConfig = require('../models/SiteConfig');
const { asyncHandler, createError } = require('../middleware/errorHandler');

// =====================================================
// CONTROLADORES PUBLICOS
// =====================================================

// Obtener configuracion publica
const getPublicConfig = asyncHandler(async (req, res) => {
  const config = await SiteConfig.getPublic();

  res.json({
    success: true,
    data: config
  });
});

// Obtener logo
const getLogo = asyncHandler(async (req, res) => {
  const logoUrl = await SiteConfig.get('logo_url');

  res.json({
    success: true,
    data: {
      logoUrl: logoUrl || '/images/logo.png'
    }
  });
});

// Obtener informacion de contacto
const getContactInfo = asyncHandler(async (req, res) => {
  const [phone, email, address, whatsapp] = await Promise.all([
    SiteConfig.get('phone'),
    SiteConfig.get('email'),
    SiteConfig.get('address'),
    SiteConfig.get('whatsapp')
  ]);

  res.json({
    success: true,
    data: {
      phone,
      email,
      address,
      whatsapp
    }
  });
});

// Obtener redes sociales
const getSocialLinks = asyncHandler(async (req, res) => {
  const [instagram, facebook, tiktok, youtube] = await Promise.all([
    SiteConfig.get('instagram'),
    SiteConfig.get('facebook'),
    SiteConfig.get('tiktok'),
    SiteConfig.get('youtube')
  ]);

  res.json({
    success: true,
    data: {
      instagram,
      facebook,
      tiktok,
      youtube
    }
  });
});

// Obtener horarios
const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await SiteConfig.get('schedule');

  res.json({
    success: true,
    data: {
      schedule: schedule || {}
    }
  });
});

// =====================================================
// CONTROLADORES ADMIN
// =====================================================

// Obtener toda la configuracion (admin)
const getAllConfig = asyncHandler(async (req, res) => {
  const config = await SiteConfig.getAll();

  res.json({
    success: true,
    data: config
  });
});

// Obtener configuracion por categoria
const getConfigByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const config = await SiteConfig.getByCategory(category);

  res.json({
    success: true,
    data: config
  });
});

// Actualizar configuracion individual
const updateConfig = asyncHandler(async (req, res) => {
  const { key, value } = req.body;

  if (!key) {
    throw createError.badRequest('La clave es requerida');
  }

  const result = await SiteConfig.set(key, value);

  res.json({
    success: true,
    message: 'Configuracion actualizada',
    data: result
  });
});

// Actualizar multiples configuraciones
const updateBulkConfig = asyncHandler(async (req, res) => {
  const { configs } = req.body;

  if (!configs || !Array.isArray(configs)) {
    throw createError.badRequest('Se requiere un array de configuraciones');
  }

  const results = await Promise.all(
    configs.map(({ key, value }) => SiteConfig.set(key, value))
  );

  res.json({
    success: true,
    message: `${results.length} configuraciones actualizadas`,
    data: results
  });
});

// Actualizar logo
const updateLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError.badRequest('No se proporciono archivo de logo');
  }

  const logoUrl = req.file.path || req.file.location;
  await SiteConfig.set('logo_url', logoUrl);

  res.json({
    success: true,
    message: 'Logo actualizado correctamente',
    data: {
      logoUrl
    }
  });
});

// Actualizar informacion de contacto
const updateContactInfo = asyncHandler(async (req, res) => {
  const { phone, email, address, whatsapp } = req.body;

  const updates = [];
  if (phone !== undefined) updates.push(SiteConfig.set('phone', phone, 'contact'));
  if (email !== undefined) updates.push(SiteConfig.set('email', email, 'contact'));
  if (address !== undefined) updates.push(SiteConfig.set('address', address, 'contact'));
  if (whatsapp !== undefined) updates.push(SiteConfig.set('whatsapp', whatsapp, 'contact'));

  await Promise.all(updates);

  res.json({
    success: true,
    message: 'Informacion de contacto actualizada'
  });
});

// Actualizar redes sociales
const updateSocialLinks = asyncHandler(async (req, res) => {
  const { instagram, facebook, tiktok, youtube } = req.body;

  const updates = [];
  if (instagram !== undefined) updates.push(SiteConfig.set('instagram', instagram, 'social'));
  if (facebook !== undefined) updates.push(SiteConfig.set('facebook', facebook, 'social'));
  if (tiktok !== undefined) updates.push(SiteConfig.set('tiktok', tiktok, 'social'));
  if (youtube !== undefined) updates.push(SiteConfig.set('youtube', youtube, 'social'));

  await Promise.all(updates);

  res.json({
    success: true,
    message: 'Redes sociales actualizadas'
  });
});

// Actualizar colores del sitio
const updateColors = asyncHandler(async (req, res) => {
  const { primaryColor, secondaryColor, accentColor, backgroundColor, textColor } = req.body;

  const updates = [];
  if (primaryColor !== undefined) updates.push(SiteConfig.set('primary_color', primaryColor, 'colors'));
  if (secondaryColor !== undefined) updates.push(SiteConfig.set('secondary_color', secondaryColor, 'colors'));
  if (accentColor !== undefined) updates.push(SiteConfig.set('accent_color', accentColor, 'colors'));
  if (backgroundColor !== undefined) updates.push(SiteConfig.set('background_color', backgroundColor, 'colors'));
  if (textColor !== undefined) updates.push(SiteConfig.set('text_color', textColor, 'colors'));

  await Promise.all(updates);

  res.json({
    success: true,
    message: 'Colores actualizados'
  });
});

// Actualizar SEO
const updateSEO = asyncHandler(async (req, res) => {
  const { siteTitle, siteDescription, keywords, ogImage } = req.body;

  const updates = [];
  if (siteTitle !== undefined) updates.push(SiteConfig.set('site_title', siteTitle, 'seo'));
  if (siteDescription !== undefined) updates.push(SiteConfig.set('site_description', siteDescription, 'seo'));
  if (keywords !== undefined) updates.push(SiteConfig.set('keywords', keywords, 'seo'));
  if (ogImage !== undefined) updates.push(SiteConfig.set('og_image', ogImage, 'seo'));

  await Promise.all(updates);

  res.json({
    success: true,
    message: 'Configuracion SEO actualizada'
  });
});

// Actualizar horarios
const updateSchedule = asyncHandler(async (req, res) => {
  const { schedule } = req.body;

  if (!schedule) {
    throw createError.badRequest('Se requiere el horario');
  }

  await SiteConfig.set('schedule', schedule, 'general');

  res.json({
    success: true,
    message: 'Horarios actualizados'
  });
});

// Eliminar configuracion
const deleteConfig = asyncHandler(async (req, res) => {
  const { key } = req.params;

  await SiteConfig.delete(key);

  res.json({
    success: true,
    message: 'Configuracion eliminada'
  });
});

// Resetear a valores por defecto
const resetToDefaults = asyncHandler(async (req, res) => {
  await SiteConfig.resetToDefaults();

  res.json({
    success: true,
    message: 'Configuracion reseteada a valores por defecto'
  });
});

// Subir imagen de logo (logo, logo_white, favicon)
const uploadLogoImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError.badRequest('No se proporcionó archivo de imagen');
  }

  const { type } = req.body; // 'logo', 'logo_white', 'favicon'
  const logoType = type || 'logo';

  // La URL viene de Cloudinary a través de multer-storage-cloudinary
  const imageUrl = req.file.path || req.file.secure_url || req.file.url;

  // Guardar en la configuración según el tipo
  const configKey = logoType === 'logo' ? 'logo_url' :
                    logoType === 'logo_white' ? 'logo_white_url' : 'favicon_url';

  await SiteConfig.set(configKey, imageUrl, 'branding');

  res.json({
    success: true,
    message: `${logoType} subido correctamente`,
    data: {
      type: logoType,
      url: imageUrl
    }
  });
});

module.exports = {
  // Publicos
  getPublicConfig,
  getLogo,
  getContactInfo,
  getSocialLinks,
  getSchedule,
  // Admin
  getAllConfig,
  getConfigByCategory,
  updateConfig,
  updateBulkConfig,
  updateLogo,
  updateContactInfo,
  updateSocialLinks,
  updateColors,
  updateSEO,
  updateSchedule,
  deleteConfig,
  resetToDefaults,
  uploadLogoImage
};
