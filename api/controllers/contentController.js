// Controlador de Contenido Dinamico
const Content = require('../models/Content');
const { asyncHandler, createError } = require('../middleware/errorHandler');

// =====================================================
// CONTROLADORES PUBLICOS
// =====================================================

// Obtener contenido por seccion
const getContentBySection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const content = await Content.getBySection(section);

  res.json({
    success: true,
    count: content.length,
    data: content
  });
});

// Obtener contenido formateado para frontend
const getFormattedContent = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const content = await Content.getFormatted(section);

  res.json({
    success: true,
    data: content
  });
});

// Obtener contenido especifico por seccion y clave
const getContent = asyncHandler(async (req, res) => {
  const { section, key } = req.params;
  const content = await Content.get(section, key);

  if (!content) {
    throw createError.notFound('Contenido no encontrado');
  }

  res.json({
    success: true,
    data: content
  });
});

// Obtener secciones disponibles
const getSections = asyncHandler(async (req, res) => {
  const sections = await Content.getSections();

  res.json({
    success: true,
    data: sections
  });
});

// =====================================================
// CONTROLADORES ADMIN
// =====================================================

// Obtener todo el contenido
const getAllContent = asyncHandler(async (req, res) => {
  const { section } = req.query;

  let content;
  if (section) {
    content = await Content.getBySection(section);
  } else {
    content = await Content.getAll();
  }

  res.json({
    success: true,
    count: content.length,
    data: content
  });
});

// Obtener contenido por ID
const getContentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const content = await Content.getById(id);

  if (!content) {
    throw createError.notFound('Contenido no encontrado');
  }

  res.json({
    success: true,
    data: content
  });
});

// Crear contenido
const createContent = asyncHandler(async (req, res) => {
  const contentData = {
    section: req.body.section,
    key: req.body.key,
    type: req.body.type || 'text',
    value: req.body.value,
    displayOrder: req.body.displayOrder,
    active: req.body.active
  };

  if (!contentData.section || !contentData.key) {
    throw createError.badRequest('Se requiere section y key');
  }

  // Verificar si ya existe
  const existing = await Content.get(contentData.section, contentData.key);
  if (existing) {
    throw createError.conflict('Ya existe contenido con esa seccion y clave');
  }

  const content = await Content.create(contentData);

  res.status(201).json({
    success: true,
    message: 'Contenido creado correctamente',
    data: content
  });
});

// Actualizar contenido
const updateContent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingContent = await Content.getById(id);
  if (!existingContent) {
    throw createError.notFound('Contenido no encontrado');
  }

  const updateData = {
    section: req.body.section,
    key: req.body.key,
    type: req.body.type,
    value: req.body.value,
    displayOrder: req.body.displayOrder,
    active: req.body.active
  };

  const content = await Content.update(id, updateData);

  res.json({
    success: true,
    message: 'Contenido actualizado correctamente',
    data: content
  });
});

// Actualizar o crear (upsert)
const upsertContent = asyncHandler(async (req, res) => {
  const { section, key, value, type = 'text' } = req.body;

  if (!section || !key) {
    throw createError.badRequest('Se requiere section y key');
  }

  const content = await Content.upsert(section, key, value, type);

  res.json({
    success: true,
    message: 'Contenido guardado correctamente',
    data: content
  });
});

// Actualizar multiples contenidos (bulk)
const bulkUpdateContent = asyncHandler(async (req, res) => {
  const { contents } = req.body;

  if (!contents || !Array.isArray(contents)) {
    throw createError.badRequest('Se requiere un array de contenidos');
  }

  const results = await Promise.all(
    contents.map(({ section, key, value, type }) =>
      Content.upsert(section, key, value, type)
    )
  );

  res.json({
    success: true,
    message: `${results.length} contenidos actualizados`,
    data: results
  });
});

// Eliminar contenido
const deleteContent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const content = await Content.getById(id);
  if (!content) {
    throw createError.notFound('Contenido no encontrado');
  }

  await Content.delete(id);

  res.json({
    success: true,
    message: 'Contenido eliminado correctamente'
  });
});

// Toggle activo/inactivo
const toggleContentActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const content = await Content.toggleActive(id);
  if (!content) {
    throw createError.notFound('Contenido no encontrado');
  }

  res.json({
    success: true,
    message: `Contenido ${content.active ? 'activado' : 'desactivado'}`,
    data: content
  });
});

// Inicializar seccion con valores por defecto
const initializeSection = asyncHandler(async (req, res) => {
  const { section, defaults } = req.body;

  if (!section || !defaults || typeof defaults !== 'object') {
    throw createError.badRequest('Se requiere section y defaults (objeto)');
  }

  await Content.initializeSection(section, defaults);

  const content = await Content.getBySection(section);

  res.json({
    success: true,
    message: `Seccion '${section}' inicializada`,
    data: content
  });
});

// Duplicar contenido de una seccion a otra
const duplicateSection = asyncHandler(async (req, res) => {
  const { sourceSection, targetSection } = req.body;

  if (!sourceSection || !targetSection) {
    throw createError.badRequest('Se requiere sourceSection y targetSection');
  }

  const sourceContent = await Content.getBySection(sourceSection);
  if (sourceContent.length === 0) {
    throw createError.notFound('Seccion origen no tiene contenido');
  }

  const results = await Promise.all(
    sourceContent.map(item =>
      Content.create({
        section: targetSection,
        key: item.content_key,
        type: item.content_type,
        value: item.content_value,
        displayOrder: item.display_order,
        active: false
      })
    )
  );

  res.status(201).json({
    success: true,
    message: `${results.length} contenidos duplicados a '${targetSection}'`,
    data: results
  });
});

// Exportar contenido de una seccion
const exportSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const { format = 'json' } = req.query;

  const content = await Content.getBySection(section);

  if (format === 'simple') {
    // Formato simplificado key: value
    const simplified = {};
    content.forEach(item => {
      simplified[item.content_key] = item.content_value;
    });

    return res.json({
      success: true,
      section,
      data: simplified
    });
  }

  res.json({
    success: true,
    section,
    count: content.length,
    data: content
  });
});

// Importar contenido a una seccion
const importSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const { contents, overwrite = false } = req.body;

  if (!contents || !Array.isArray(contents)) {
    throw createError.badRequest('Se requiere un array de contenidos');
  }

  const results = {
    created: 0,
    updated: 0,
    skipped: 0
  };

  for (const item of contents) {
    const existing = await Content.get(section, item.key);

    if (existing) {
      if (overwrite) {
        await Content.update(existing.id, {
          value: item.value,
          type: item.type
        });
        results.updated++;
      } else {
        results.skipped++;
      }
    } else {
      await Content.create({
        section,
        key: item.key,
        value: item.value,
        type: item.type || 'text',
        displayOrder: item.displayOrder || 0,
        active: item.active !== false
      });
      results.created++;
    }
  }

  res.json({
    success: true,
    message: `Importacion completada: ${results.created} creados, ${results.updated} actualizados, ${results.skipped} omitidos`,
    data: results
  });
});

module.exports = {
  // Publicos
  getContentBySection,
  getFormattedContent,
  getContent,
  getSections,
  // Admin
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  upsertContent,
  bulkUpdateContent,
  deleteContent,
  toggleContentActive,
  initializeSection,
  duplicateSection,
  exportSection,
  importSection
};
