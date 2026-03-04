// Middleware para verificar roles de usuario

// Verificar que el usuario sea admin o superadmin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requiere rol de administrador.'
  });
};

// Verificar que el usuario sea superadmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requiere rol de superadministrador.'
  });
};

// Verificar que el usuario tenga al menos rol de editor
const isEditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.role === 'editor' || req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requiere al menos rol de editor.'
  });
};

// Verificar permisos especificos
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Superadmin tiene todos los permisos
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Verificar si el usuario tiene el permiso especifico
    const userPermissions = req.user.permissions || [];
    if (userPermissions.includes(permission) || userPermissions.includes('*')) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acceso denegado. Se requiere permiso: ${permission}`
    });
  };
};

// Lista de permisos disponibles
const PERMISSIONS = {
  // Configuracion
  CONFIG_READ: 'config:read',
  CONFIG_WRITE: 'config:write',

  // Banners
  BANNERS_READ: 'banners:read',
  BANNERS_WRITE: 'banners:write',
  BANNERS_DELETE: 'banners:delete',

  // Servicios
  SERVICES_READ: 'services:read',
  SERVICES_WRITE: 'services:write',
  SERVICES_DELETE: 'services:delete',

  // Clientes
  CLIENTS_READ: 'clients:read',
  CLIENTS_WRITE: 'clients:write',
  CLIENTS_DELETE: 'clients:delete',
  CLIENTS_EXPORT: 'clients:export',

  // Promociones
  PROMOTIONS_READ: 'promotions:read',
  PROMOTIONS_WRITE: 'promotions:write',
  PROMOTIONS_DELETE: 'promotions:delete',

  // Contactos
  CONTACTS_READ: 'contacts:read',
  CONTACTS_WRITE: 'contacts:write',
  CONTACTS_DELETE: 'contacts:delete',

  // Turnos
  APPOINTMENTS_READ: 'appointments:read',
  APPOINTMENTS_WRITE: 'appointments:write',
  APPOINTMENTS_DELETE: 'appointments:delete',

  // Usuarios
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  // Estadisticas
  STATS_READ: 'stats:read'
};

// Permisos por defecto para cada rol
const DEFAULT_PERMISSIONS = {
  superadmin: ['*'], // Todos los permisos
  admin: [
    PERMISSIONS.CONFIG_READ,
    PERMISSIONS.CONFIG_WRITE,
    PERMISSIONS.BANNERS_READ,
    PERMISSIONS.BANNERS_WRITE,
    PERMISSIONS.BANNERS_DELETE,
    PERMISSIONS.SERVICES_READ,
    PERMISSIONS.SERVICES_WRITE,
    PERMISSIONS.SERVICES_DELETE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.CLIENTS_DELETE,
    PERMISSIONS.CLIENTS_EXPORT,
    PERMISSIONS.PROMOTIONS_READ,
    PERMISSIONS.PROMOTIONS_WRITE,
    PERMISSIONS.PROMOTIONS_DELETE,
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.CONTACTS_WRITE,
    PERMISSIONS.CONTACTS_DELETE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_DELETE,
    PERMISSIONS.STATS_READ
  ],
  editor: [
    PERMISSIONS.CONFIG_READ,
    PERMISSIONS.BANNERS_READ,
    PERMISSIONS.BANNERS_WRITE,
    PERMISSIONS.SERVICES_READ,
    PERMISSIONS.SERVICES_WRITE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.PROMOTIONS_READ,
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.CONTACTS_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.STATS_READ
  ]
};

module.exports = {
  isAdmin,
  isSuperAdmin,
  isEditor,
  hasPermission,
  PERMISSIONS,
  DEFAULT_PERMISSIONS
};
