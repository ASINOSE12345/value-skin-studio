// Controlador de Servicios
const Service = require('../models/Service');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { getPublicIdFromUrl, deleteImage } = require('../config/cloudinary');

// =====================================================
// CONTROLADORES PUBLICOS
// =====================================================

// Obtener todos los servicios activos
const getActiveServices = asyncHandler(async (req, res) => {
  const services = await Service.getActive();

  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// Obtener servicios por categoria
const getServicesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const validCategories = ['para-ti', 'hoteles', 'empresas', 'escuela'];

  if (!validCategories.includes(category)) {
    throw createError.badRequest(`Categoria invalida. Debe ser: ${validCategories.join(', ')}`);
  }

  const services = await Service.getByCategory(category);

  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// Obtener servicio por slug
const getServiceBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const service = await Service.getBySlug(slug);

  if (!service) {
    throw createError.notFound('Servicio no encontrado');
  }

  res.json({
    success: true,
    data: service
  });
});

// Obtener servicio por ID (publico)
const getServicePublic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await Service.getById(id);

  if (!service || !service.active) {
    throw createError.notFound('Servicio no encontrado');
  }

  res.json({
    success: true,
    data: service
  });
});

// Obtener servicios destacados
const getFeaturedServices = asyncHandler(async (req, res) => {
  const services = await Service.getFeatured();

  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// Buscar servicios
const searchServices = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    throw createError.badRequest('El termino de busqueda debe tener al menos 2 caracteres');
  }

  const services = await Service.search(q);

  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// Obtener categorias disponibles
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Service.getCategories();

  res.json({
    success: true,
    data: categories
  });
});

// =====================================================
// CONTROLADORES ADMIN
// =====================================================

// Obtener todos los servicios (admin)
const getAllServices = asyncHandler(async (req, res) => {
  const { category, featured } = req.query;

  let services;

  if (category) {
    services = await Service.getByCategory(category, true);
  } else if (featured === 'true') {
    services = await Service.getFeatured();
  } else {
    services = await Service.getAll();
  }

  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// Obtener servicio por ID (admin)
const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await Service.getById(id);

  if (!service) {
    throw createError.notFound('Servicio no encontrado');
  }

  res.json({
    success: true,
    data: service
  });
});

// Crear servicio
const createService = asyncHandler(async (req, res) => {
  const serviceData = {
    name: req.body.name,
    description: req.body.description,
    shortDescription: req.body.shortDescription,
    category: req.body.category,
    price: req.body.price,
    duration: req.body.duration,
    features: req.body.features,
    benefits: req.body.benefits,
    featured: req.body.featured,
    displayOrder: req.body.displayOrder,
    active: req.body.active
  };

  // Si hay archivo de imagen
  if (req.file) {
    serviceData.imageUrl = req.file.path || req.file.location;
  } else if (req.body.imageUrl) {
    serviceData.imageUrl = req.body.imageUrl;
  }

  // Galeria de imagenes
  if (req.body.gallery) {
    serviceData.gallery = typeof req.body.gallery === 'string'
      ? JSON.parse(req.body.gallery)
      : req.body.gallery;
  }

  const service = await Service.create(serviceData);

  res.status(201).json({
    success: true,
    message: 'Servicio creado correctamente',
    data: service
  });
});

// Actualizar servicio
const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingService = await Service.getById(id);
  if (!existingService) {
    throw createError.notFound('Servicio no encontrado');
  }

  const updateData = { ...req.body };

  // Parsear features y benefits si vienen como string
  if (updateData.features && typeof updateData.features === 'string') {
    updateData.features = JSON.parse(updateData.features);
  }
  if (updateData.benefits && typeof updateData.benefits === 'string') {
    updateData.benefits = JSON.parse(updateData.benefits);
  }
  if (updateData.gallery && typeof updateData.gallery === 'string') {
    updateData.gallery = JSON.parse(updateData.gallery);
  }

  // Si hay nuevo archivo de imagen
  if (req.file) {
    if (existingService.image_url) {
      const publicId = getPublicIdFromUrl(existingService.image_url);
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

  const service = await Service.update(id, updateData);

  res.json({
    success: true,
    message: 'Servicio actualizado correctamente',
    data: service
  });
});

// Eliminar servicio
const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.getById(id);
  if (!service) {
    throw createError.notFound('Servicio no encontrado');
  }

  // Eliminar imagen de Cloudinary si existe
  if (service.image_url) {
    const publicId = getPublicIdFromUrl(service.image_url);
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (err) {
        console.error('Error eliminando imagen:', err);
      }
    }
  }

  await Service.delete(id);

  res.json({
    success: true,
    message: 'Servicio eliminado correctamente'
  });
});

// Toggle activo/inactivo
const toggleServiceActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.toggleActive(id);
  if (!service) {
    throw createError.notFound('Servicio no encontrado');
  }

  res.json({
    success: true,
    message: `Servicio ${service.active ? 'activado' : 'desactivado'} correctamente`,
    data: service
  });
});

// Toggle destacado
const toggleServiceFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.toggleFeatured(id);
  if (!service) {
    throw createError.notFound('Servicio no encontrado');
  }

  res.json({
    success: true,
    message: `Servicio ${service.featured ? 'destacado' : 'quitado de destacados'}`,
    data: service
  });
});

// Reordenar servicios
const reorderServices = asyncHandler(async (req, res) => {
  const { category, order } = req.body;

  if (!category || !order || !Array.isArray(order)) {
    throw createError.badRequest('Se requiere category y order (array de IDs)');
  }

  await Service.reorder(category, order);

  res.json({
    success: true,
    message: 'Orden de servicios actualizado'
  });
});

// Duplicar servicio
const duplicateService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const original = await Service.getById(id);
  if (!original) {
    throw createError.notFound('Servicio no encontrado');
  }

  const duplicateData = {
    name: `${original.name} (copia)`,
    description: original.description,
    shortDescription: original.short_description,
    category: original.category,
    price: original.price,
    duration: original.duration,
    imageUrl: original.image_url,
    features: original.features,
    benefits: original.benefits,
    gallery: original.gallery,
    featured: false,
    active: false
  };

  const newService = await Service.create(duplicateData);

  res.status(201).json({
    success: true,
    message: 'Servicio duplicado correctamente',
    data: newService
  });
});

// Subir imagen de servicio
const uploadServiceImage = asyncHandler(async (req, res) => {
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

// Obtener estadisticas de servicios
const getServiceStats = asyncHandler(async (req, res) => {
  const total = await Service.count();
  const active = await Service.count(true);
  const categories = await Service.getCategories();

  const byCategory = {};
  for (const cat of categories) {
    const services = await Service.getByCategory(cat.category, true);
    byCategory[cat.category] = services.length;
  }

  res.json({
    success: true,
    data: {
      total,
      active,
      inactive: total - active,
      byCategory
    }
  });
});

module.exports = {
  // Publicos
  getActiveServices,
  getServicesByCategory,
  getServiceBySlug,
  getServicePublic,
  getFeaturedServices,
  searchServices,
  getCategories,
  // Admin
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
  toggleServiceFeatured,
  reorderServices,
  duplicateService,
  uploadServiceImage,
  getServiceStats
};
