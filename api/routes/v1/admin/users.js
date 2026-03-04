// Rutas admin de usuarios
const express = require('express');
const router = express.Router();
const User = require('../../../models/User');
const { authenticate } = require('../../../middleware/auth');
const { isSuperAdmin } = require('../../../middleware/roles');
const { asyncHandler, createError } = require('../../../middleware/errorHandler');
const { validateUser } = require('../../../middleware/validate');

// Todas las rutas requieren autenticacion y rol superadmin
router.use(authenticate);
router.use(isSuperAdmin);

// GET /api/v1/admin/users - Obtener todos los usuarios
router.get('/', asyncHandler(async (req, res) => {
  const { role, active } = req.query;

  let users = await User.getAll();

  // Filtrar por rol
  if (role) {
    users = users.filter(u => u.role === role);
  }

  // Filtrar por activo
  if (active !== undefined) {
    const isActive = active === 'true';
    users = users.filter(u => u.active === isActive);
  }

  // Remover passwords
  users = users.map(u => {
    const { password, ...safeUser } = u;
    return safeUser;
  });

  res.json({
    success: true,
    count: users.length,
    data: users
  });
}));

// GET /api/v1/admin/users/:id - Obtener usuario por ID
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.getById(req.params.id);

  if (!user) {
    throw createError.notFound('Usuario no encontrado');
  }

  const { password, ...safeUser } = user;

  res.json({
    success: true,
    data: safeUser
  });
}));

// POST /api/v1/admin/users - Crear usuario
router.post('/', validateUser, asyncHandler(async (req, res) => {
  const userData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role || 'editor',
    active: req.body.active !== false
  };

  // Verificar email unico
  const existing = await User.getByEmail(userData.email);
  if (existing) {
    throw createError.conflict('Ya existe un usuario con ese email');
  }

  const user = await User.create(userData);
  const { password, ...safeUser } = user;

  res.status(201).json({
    success: true,
    message: 'Usuario creado correctamente',
    data: safeUser
  });
}));

// PUT /api/v1/admin/users/:id - Actualizar usuario
router.put('/:id', asyncHandler(async (req, res) => {
  const existing = await User.getById(req.params.id);

  if (!existing) {
    throw createError.notFound('Usuario no encontrado');
  }

  // Verificar email unico si se cambia
  if (req.body.email && req.body.email !== existing.email) {
    const emailExists = await User.getByEmail(req.body.email);
    if (emailExists) {
      throw createError.conflict('Ya existe un usuario con ese email');
    }
  }

  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.email !== undefined) updateData.email = req.body.email;
  if (req.body.role !== undefined) updateData.role = req.body.role;
  if (req.body.active !== undefined) updateData.active = req.body.active;

  const user = await User.update(req.params.id, updateData);
  const { password, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Usuario actualizado',
    data: safeUser
  });
}));

// PUT /api/v1/admin/users/:id/password - Cambiar password de usuario
router.put('/:id/password', asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    throw createError.badRequest('La password debe tener al menos 6 caracteres');
  }

  const user = await User.getById(req.params.id);

  if (!user) {
    throw createError.notFound('Usuario no encontrado');
  }

  await User.updatePassword(req.params.id, password);

  res.json({
    success: true,
    message: 'Password actualizada correctamente'
  });
}));

// PUT /api/v1/admin/users/:id/role - Cambiar rol de usuario
router.put('/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['superadmin', 'admin', 'editor'];

  if (!validRoles.includes(role)) {
    throw createError.badRequest(`Rol invalido. Debe ser: ${validRoles.join(', ')}`);
  }

  const user = await User.changeRole(req.params.id, role);

  if (!user) {
    throw createError.notFound('Usuario no encontrado');
  }

  const { password, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Rol actualizado',
    data: safeUser
  });
}));

// PATCH /api/v1/admin/users/:id/toggle - Toggle activo/inactivo
router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  const user = await User.toggleActive(req.params.id);

  if (!user) {
    throw createError.notFound('Usuario no encontrado');
  }

  const { password, ...safeUser } = user;

  res.json({
    success: true,
    message: `Usuario ${user.active ? 'activado' : 'desactivado'}`,
    data: safeUser
  });
}));

// DELETE /api/v1/admin/users/:id - Eliminar usuario
router.delete('/:id', asyncHandler(async (req, res) => {
  const user = await User.getById(req.params.id);

  if (!user) {
    throw createError.notFound('Usuario no encontrado');
  }

  // No permitir eliminar al propio usuario
  if (user.id === req.user.id) {
    throw createError.badRequest('No puedes eliminar tu propio usuario');
  }

  await User.delete(req.params.id);

  res.json({
    success: true,
    message: 'Usuario eliminado'
  });
}));

module.exports = router;
