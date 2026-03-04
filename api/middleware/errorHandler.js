// Middleware centralizado para manejo de errores

// Clase de error personalizada
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores comunes
const createError = {
  badRequest: (message = 'Solicitud invalida') => new AppError(message, 400, 'BAD_REQUEST'),
  unauthorized: (message = 'No autorizado') => new AppError(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Acceso denegado') => new AppError(message, 403, 'FORBIDDEN'),
  notFound: (message = 'Recurso no encontrado') => new AppError(message, 404, 'NOT_FOUND'),
  conflict: (message = 'Conflicto con el estado actual') => new AppError(message, 409, 'CONFLICT'),
  validation: (message = 'Error de validacion') => new AppError(message, 422, 'VALIDATION_ERROR'),
  internal: (message = 'Error interno del servidor') => new AppError(message, 500, 'INTERNAL_ERROR')
};

// Manejador de errores para rutas async
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log del error (en produccion usar un logger como Winston)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
  }

  // Errores de Supabase/PostgreSQL
  if (err.code === '23505') {
    // Unique constraint violation
    error = createError.conflict('Ya existe un registro con esos datos');
  }

  if (err.code === '23503') {
    // Foreign key violation
    error = createError.badRequest('Referencia a un registro que no existe');
  }

  if (err.code === '22P02') {
    // Invalid UUID
    error = createError.badRequest('ID invalido');
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    error = createError.unauthorized('Token invalido');
  }

  if (err.name === 'TokenExpiredError') {
    error = createError.unauthorized('Token expirado');
  }

  // Errores de Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = createError.badRequest('El archivo es demasiado grande');
    } else {
      error = createError.badRequest(`Error de upload: ${err.message}`);
    }
  }

  // Errores de validacion de express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    error = createError.validation(errors[0]?.msg || 'Error de validacion');
  }

  // Respuesta de error
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Error interno del servidor',
    code: error.code || 'INTERNAL_ERROR'
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res, next) => {
  const error = createError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  next(error);
};

module.exports = {
  AppError,
  createError,
  asyncHandler,
  errorHandler,
  notFoundHandler
};
