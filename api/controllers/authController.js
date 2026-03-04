// Controlador de Autenticacion
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
// Parse JWT_EXPIRES_IN - puede ser numero (segundos) o string ('24h', '7d')
const rawExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
const JWT_EXPIRES_IN = /^\d+$/.test(rawExpiresIn) ? parseInt(rawExpiresIn, 10) : rawExpiresIn;
const rawRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = /^\d+$/.test(rawRefreshExpiresIn) ? parseInt(rawRefreshExpiresIn, 10) : rawRefreshExpiresIn;

// Generar access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generar refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

// Login
exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw createError.badRequest('Username y password son requeridos');
  }

  const user = await User.validatePassword(username, password);

  if (!user) {
    throw createError.unauthorized('Credenciales invalidas');
  }

  if (!user.active) {
    throw createError.forbidden('Usuario desactivado');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Guardar refresh token en la base de datos
  await User.updateRefreshToken(user.id, refreshToken);

  res.json({
    success: true,
    message: 'Login exitoso',
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// Logout
exports.logout = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (userId) {
    await User.updateRefreshToken(userId, null);
  }

  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

// Refresh token
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError.badRequest('Refresh token requerido');
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      throw createError.unauthorized('Token invalido');
    }

    const user = await User.findByRefreshToken(refreshToken);

    if (!user) {
      throw createError.unauthorized('Token invalido o expirado');
    }

    if (!user.active) {
      throw createError.forbidden('Usuario desactivado');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await User.updateRefreshToken(user.id, newRefreshToken);

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw createError.unauthorized('Refresh token expirado. Por favor inicie sesion nuevamente.');
    }
    throw createError.unauthorized('Token invalido');
  }
});

// Obtener perfil actual
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw createError.notFound('Usuario no encontrado');
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.last_login,
      createdAt: user.created_at
    }
  });
});

// Actualizar perfil
exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, avatar } = req.body;

  const updates = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (email !== undefined) updates.email = email;
  if (avatar !== undefined) updates.avatar = avatar;

  // Si hay archivo subido
  if (req.fileUrl) {
    updates.avatar = req.fileUrl;
  }

  const user = await User.update(req.user.id, updates);

  if (!user) {
    throw createError.notFound('Usuario no encontrado');
  }

  res.json({
    success: true,
    message: 'Perfil actualizado',
    data: user
  });
});

// Cambiar password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError.badRequest('Password actual y nuevo son requeridos');
  }

  if (newPassword.length < 8) {
    throw createError.badRequest('El nuevo password debe tener al menos 8 caracteres');
  }

  const result = await User.changePassword(req.user.id, currentPassword, newPassword);

  if (!result.success) {
    throw createError.badRequest(result.message);
  }

  res.json({
    success: true,
    message: 'Password actualizado correctamente'
  });
});

// Solicitar reset de password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError.badRequest('Email requerido');
  }

  const user = await User.findByEmail(email);

  // Siempre responder con exito por seguridad
  if (!user) {
    return res.json({
      success: true,
      message: 'Si el email existe, recibiras instrucciones para resetear tu password'
    });
  }

  // Generar token de reset
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hora

  await User.setPasswordResetToken(email, resetToken, resetExpires);

  // TODO: Enviar email con el token
  // En produccion, enviar email con link: /reset-password?token=${resetToken}
  console.log('Reset token generado:', resetToken);

  res.json({
    success: true,
    message: 'Si el email existe, recibiras instrucciones para resetear tu password'
  });
});

// Resetear password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw createError.badRequest('Token y nuevo password son requeridos');
  }

  if (newPassword.length < 8) {
    throw createError.badRequest('El password debe tener al menos 8 caracteres');
  }

  const user = await User.findByResetToken(token);

  if (!user) {
    throw createError.badRequest('Token invalido o expirado');
  }

  await User.resetPassword(user.id, newPassword);

  res.json({
    success: true,
    message: 'Password reseteado correctamente. Ya puedes iniciar sesion.'
  });
});

// Verificar token (para el frontend)
exports.verify = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user || !user.active) {
    throw createError.unauthorized('Token invalido');
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// Register - solo para setup inicial o superadmin
exports.register = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  // Verificar si ya existe el usuario
  const existingByEmail = await User.findByEmail(email);
  if (existingByEmail) {
    throw createError.conflict('El email ya esta registrado');
  }

  const existingByUsername = await User.findByUsername(username);
  if (existingByUsername) {
    throw createError.conflict('El username ya esta en uso');
  }

  const user = await User.create({
    username,
    email,
    password,
    first_name: firstName,
    last_name: lastName,
    role: role || 'admin'
  });

  res.status(201).json({
    success: true,
    message: 'Usuario registrado correctamente',
    data: user
  });
});

// Obtener usuario actual (alias de getProfile)
exports.getCurrentUser = exports.getProfile;

// Refresh token (alias de refresh)
exports.refreshToken = exports.refresh;

// Verificar token (alias de verify)
exports.verifyToken = exports.verify;
