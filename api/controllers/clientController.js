// Controlador de Clientes
const Client = require('../models/Client');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { getPublicIdFromUrl, deleteImage } = require('../config/cloudinary');

// =====================================================
// CONTROLADORES ADMIN
// =====================================================

// Obtener todos los clientes con paginacion
const getAllClients = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const result = await Client.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder
  });

  res.json({
    success: true,
    ...result
  });
});

// Buscar clientes
const searchClients = asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    throw createError.badRequest('El termino de busqueda debe tener al menos 2 caracteres');
  }

  const clients = await Client.search(q, parseInt(limit));

  res.json({
    success: true,
    count: clients.length,
    data: clients
  });
});

// Obtener cliente por ID
const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await Client.getById(id);

  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  res.json({
    success: true,
    data: client
  });
});

// Obtener cliente por email
const getClientByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const client = await Client.getByEmail(email);

  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  res.json({
    success: true,
    data: client
  });
});

// Crear cliente
const createClient = asyncHandler(async (req, res) => {
  const clientData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    birthDate: req.body.birthDate,
    gender: req.body.gender,
    address: req.body.address,
    city: req.body.city,
    postalCode: req.body.postalCode,
    notes: req.body.notes,
    tags: req.body.tags,
    preferredContact: req.body.preferredContact,
    marketingConsent: req.body.marketingConsent,
    source: req.body.source || 'admin'
  };

  // Si hay archivo de avatar
  if (req.file) {
    clientData.avatarUrl = req.file.path || req.file.location;
  } else if (req.body.avatarUrl) {
    clientData.avatarUrl = req.body.avatarUrl;
  }

  // Verificar si el email ya existe
  if (clientData.email) {
    const existing = await Client.getByEmail(clientData.email);
    if (existing) {
      throw createError.conflict('Ya existe un cliente con ese email');
    }
  }

  const client = await Client.create(clientData);

  res.status(201).json({
    success: true,
    message: 'Cliente creado correctamente',
    data: client
  });
});

// Actualizar cliente
const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingClient = await Client.getById(id);
  if (!existingClient) {
    throw createError.notFound('Cliente no encontrado');
  }

  const updateData = { ...req.body };

  // Si hay tags como string, parsear
  if (updateData.tags && typeof updateData.tags === 'string') {
    updateData.tags = JSON.parse(updateData.tags);
  }

  // Si hay nuevo archivo de avatar
  if (req.file) {
    if (existingClient.avatar_url) {
      const publicId = getPublicIdFromUrl(existingClient.avatar_url);
      if (publicId) {
        try {
          await deleteImage(publicId);
        } catch (err) {
          console.error('Error eliminando avatar anterior:', err);
        }
      }
    }
    updateData.avatarUrl = req.file.path || req.file.location;
  }

  // Verificar email unico si se esta cambiando
  if (updateData.email && updateData.email !== existingClient.email) {
    const emailExists = await Client.getByEmail(updateData.email);
    if (emailExists) {
      throw createError.conflict('Ya existe un cliente con ese email');
    }
  }

  const client = await Client.update(id, updateData);

  res.json({
    success: true,
    message: 'Cliente actualizado correctamente',
    data: client
  });
});

// Eliminar cliente
const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await Client.getById(id);
  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  // Eliminar avatar de Cloudinary si existe
  if (client.avatar_url) {
    const publicId = getPublicIdFromUrl(client.avatar_url);
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (err) {
        console.error('Error eliminando avatar:', err);
      }
    }
  }

  await Client.delete(id);

  res.json({
    success: true,
    message: 'Cliente eliminado correctamente'
  });
});

// Agregar historial al cliente
const addClientHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, description, metadata } = req.body;

  if (!type || !description) {
    throw createError.badRequest('Se requiere type y description');
  }

  const validTypes = ['appointment', 'purchase', 'note', 'contact', 'promotion'];
  if (!validTypes.includes(type)) {
    throw createError.badRequest(`Tipo invalido. Debe ser: ${validTypes.join(', ')}`);
  }

  const client = await Client.addHistory(id, {
    type,
    description,
    metadata,
    created_by: req.user?.id
  });

  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  res.json({
    success: true,
    message: 'Historial agregado correctamente',
    data: client
  });
});

// Obtener historial del cliente
const getClientHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, limit = 50 } = req.query;

  const client = await Client.getById(id);
  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  let history = client.history || [];

  if (type) {
    history = history.filter(h => h.type === type);
  }

  history = history.slice(0, parseInt(limit));

  res.json({
    success: true,
    count: history.length,
    data: history
  });
});

// Agregar tags al cliente
const addClientTags = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tags } = req.body;

  if (!tags || !Array.isArray(tags)) {
    throw createError.badRequest('Se requiere un array de tags');
  }

  const client = await Client.addTags(id, tags);
  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  res.json({
    success: true,
    message: 'Tags agregados correctamente',
    data: client
  });
});

// Remover tags del cliente
const removeClientTags = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tags } = req.body;

  if (!tags || !Array.isArray(tags)) {
    throw createError.badRequest('Se requiere un array de tags');
  }

  const client = await Client.removeTags(id, tags);
  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  res.json({
    success: true,
    message: 'Tags removidos correctamente',
    data: client
  });
});

// Obtener clientes por tag
const getClientsByTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const clients = await Client.getByTag(tag);

  res.json({
    success: true,
    count: clients.length,
    data: clients
  });
});

// Obtener todos los tags unicos
const getAllTags = asyncHandler(async (req, res) => {
  const tags = await Client.getAllTags();

  res.json({
    success: true,
    count: tags.length,
    data: tags
  });
});

// Actualizar total gastado
const updateTotalSpent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (amount === undefined || isNaN(amount)) {
    throw createError.badRequest('Se requiere un monto valido');
  }

  const client = await Client.updateTotalSpent(id, parseFloat(amount));
  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  res.json({
    success: true,
    message: 'Total gastado actualizado',
    data: client
  });
});

// Actualizar ultimo contacto
const updateLastContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await Client.updateLastContact(id);
  if (!client) {
    throw createError.notFound('Cliente no encontrado');
  }

  res.json({
    success: true,
    message: 'Ultimo contacto actualizado',
    data: client
  });
});

// Exportar clientes
const exportClients = asyncHandler(async (req, res) => {
  const { format = 'json', fields } = req.query;

  const clients = await Client.exportData(
    fields ? fields.split(',') : null
  );

  if (format === 'csv') {
    // Generar CSV
    if (clients.length === 0) {
      return res.status(200).send('');
    }

    const headers = Object.keys(clients[0]);
    const csvRows = [headers.join(',')];

    clients.forEach(client => {
      const values = headers.map(h => {
        const val = client[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clientes.csv');
    return res.send(csvRows.join('\n'));
  }

  res.json({
    success: true,
    count: clients.length,
    data: clients
  });
});

// Obtener estadisticas de clientes
const getClientStats = asyncHandler(async (req, res) => {
  const stats = await Client.getStats();

  res.json({
    success: true,
    data: stats
  });
});

// Subir avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError.badRequest('No se proporciono imagen');
  }

  res.json({
    success: true,
    message: 'Avatar subido correctamente',
    data: {
      url: req.file.path || req.file.location,
      filename: req.file.filename || req.file.originalname
    }
  });
});

// Importar clientes (bulk)
const importClients = asyncHandler(async (req, res) => {
  const { clients } = req.body;

  if (!clients || !Array.isArray(clients)) {
    throw createError.badRequest('Se requiere un array de clientes');
  }

  const results = {
    created: 0,
    updated: 0,
    errors: []
  };

  for (const clientData of clients) {
    try {
      if (clientData.email) {
        const existing = await Client.getByEmail(clientData.email);
        if (existing) {
          await Client.update(existing.id, clientData);
          results.updated++;
        } else {
          await Client.create(clientData);
          results.created++;
        }
      } else {
        await Client.create(clientData);
        results.created++;
      }
    } catch (err) {
      results.errors.push({
        email: clientData.email,
        error: err.message
      });
    }
  }

  res.json({
    success: true,
    message: `Importacion completada: ${results.created} creados, ${results.updated} actualizados`,
    data: results
  });
});

module.exports = {
  getAllClients,
  searchClients,
  getClientById,
  getClientByEmail,
  createClient,
  updateClient,
  deleteClient,
  addClientHistory,
  getClientHistory,
  addClientTags,
  removeClientTags,
  getClientsByTag,
  getAllTags,
  updateTotalSpent,
  updateLastContact,
  exportClients,
  getClientStats,
  uploadAvatar,
  importClients
};
