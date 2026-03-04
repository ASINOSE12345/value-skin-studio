// Middleware de Autenticacion JWT
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Parse JWT_EXPIRES_IN - puede ser numero (segundos) o string ('24h', '7d')
const parseExpiresIn = (value, defaultValue) => {
  if (!value) return defaultValue;
  return /^\d+$/.test(value) ? parseInt(value, 10) : value;
};

// Verificar token JWT
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError.unauthorized('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw createError.unauthorized('Token expirado');
      }
      throw createError.unauthorized('Token invalido');
    }

    // Buscar usuario
    const user = await User.getById(decoded.id);

    if (!user) {
      throw createError.unauthorized('Usuario no encontrado');
    }

    if (!user.active) {
      throw createError.unauthorized('Usuario desactivado');
    }

    // Agregar usuario a request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Alias para compatibilidad
const verifyToken = authenticate;

// Middleware opcional - no falla si no hay token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.getById(decoded.id);

      if (user && user.active) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    } catch (err) {
      // Ignorar errores de token invalido
    }

    next();
  } catch (error) {
    next();
  }
};

// Generar token de acceso
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: parseExpiresIn(process.env.JWT_EXPIRES_IN, '24h') }
  );
};

// Alias
const generateAccessToken = generateToken;

// Generar token de refresco
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verificar token de refresco
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Verificar si es admin (legacy)
const isAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado'
    });
  }
  next();
};

module.exports = {
  authenticate,
  verifyToken,
  optionalAuth,
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  isAdmin
};
