const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validacion
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validacion',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validaciones para Contact
const validateContact = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('El telefono es requerido')
    .isLength({ min: 8, max: 30 }).withMessage('Telefono invalido'),
  body('type')
    .optional()
    .isIn(['cliente', 'hotel', 'empresa', 'escuela', 'otro']).withMessage('Tipo de contacto invalido'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('El mensaje no puede exceder 2000 caracteres'),
  handleValidationErrors
];

// Validaciones para Appointment
const validateAppointment = [
  body('clientName')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('clientEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('clientPhone')
    .trim()
    .notEmpty().withMessage('El telefono es requerido')
    .isLength({ min: 8, max: 30 }).withMessage('Telefono invalido'),
  body('service')
    .trim()
    .notEmpty().withMessage('El servicio es requerido'),
  body('date')
    .notEmpty().withMessage('La fecha es requerida')
    .isISO8601().withMessage('Formato de fecha invalido (usar YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('La fecha no puede ser anterior a hoy');
      }
      return true;
    }),
  body('time')
    .notEmpty().withMessage('La hora es requerida')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora invalido (usar HH:MM)'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres'),
  handleValidationErrors
];

// Validaciones para User
const validateUser = [
  body('username')
    .trim()
    .notEmpty().withMessage('El username es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El username solo puede contener letras, numeros y guiones bajos'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El apellido no puede exceder 50 caracteres'),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'editor']).withMessage('Rol invalido'),
  handleValidationErrors
];

// Validaciones para actualizar User (password opcional)
const validateUserUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El username solo puede contener letras, numeros y guiones bajos'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El apellido no puede exceder 50 caracteres'),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'editor']).withMessage('Rol invalido'),
  body('active')
    .optional()
    .isBoolean().withMessage('El campo active debe ser booleano'),
  handleValidationErrors
];

// Validaciones para Service
const validateService = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('category')
    .notEmpty().withMessage('La categoria es requerida')
    .isIn(['para-ti', 'hoteles', 'empresas', 'escuela']).withMessage('Categoria invalida'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La descripcion no puede exceder 2000 caracteres'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('La descripcion corta no puede exceder 300 caracteres'),
  body('sessions')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Numero de sesiones invalido'),
  body('weeks')
    .optional()
    .isInt({ min: 1, max: 52 }).withMessage('Numero de semanas invalido'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Precio invalido'),
  body('priceText')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El texto de precio no puede exceder 100 caracteres'),
  body('features')
    .optional()
    .isArray().withMessage('Features debe ser un array'),
  body('featured')
    .optional()
    .isBoolean().withMessage('Featured debe ser booleano'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active debe ser booleano'),
  handleValidationErrors
];

// Validaciones para Banner
const validateBanner = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('section')
    .notEmpty().withMessage('La seccion es requerida')
    .isIn(['hero', 'cta', 'features', 'promo']).withMessage('Seccion invalida'),
  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('URL de imagen invalida'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('El titulo no puede exceder 200 caracteres'),
  body('subtitle')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El subtitulo no puede exceder 500 caracteres'),
  body('ctaText')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El texto del CTA no puede exceder 100 caracteres'),
  body('ctaLink')
    .optional()
    .trim(),
  body('overlayEnabled')
    .optional()
    .isBoolean().withMessage('OverlayEnabled debe ser booleano'),
  body('overlayOpacity')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Opacidad debe estar entre 0 y 1'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active debe ser booleano'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Fecha de inicio invalida'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Fecha de fin invalida'),
  handleValidationErrors
];

// Validaciones para Client
const validateClient = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Telefono invalido'),
  body('clientType')
    .optional()
    .isIn(['individual', 'hotel', 'empresa']).withMessage('Tipo de cliente invalido'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'vip']).withMessage('Estado invalido'),
  body('newsletter')
    .optional()
    .isBoolean().withMessage('Newsletter debe ser booleano'),
  handleValidationErrors
];

// Validaciones para Promotion
const validatePromotion = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('title')
    .trim()
    .notEmpty().withMessage('El titulo es requerido')
    .isLength({ min: 2, max: 200 }).withMessage('El titulo debe tener entre 2 y 200 caracteres'),
  body('promoType')
    .optional()
    .isIn(['percentage', 'fixed', '2x1', 'bundle']).withMessage('Tipo de promocion invalido'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed']).withMessage('Tipo de descuento invalido'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0 }).withMessage('Valor de descuento invalido'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('El codigo debe tener entre 3 y 50 caracteres')
    .matches(/^[A-Z0-9_-]+$/i).withMessage('El codigo solo puede contener letras, numeros, guiones y guiones bajos'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active debe ser booleano'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Fecha de inicio invalida'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Fecha de fin invalida'),
  handleValidationErrors
];

// Validaciones para SiteConfig
const validateSiteConfig = [
  body('siteName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre del sitio debe tener entre 1 y 100 caracteres'),
  body('tagline')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('El tagline no puede exceder 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripcion no puede exceder 500 caracteres'),
  body('contact')
    .optional()
    .isObject().withMessage('Contact debe ser un objeto'),
  body('social')
    .optional()
    .isObject().withMessage('Social debe ser un objeto'),
  body('seo')
    .optional()
    .isObject().withMessage('SEO debe ser un objeto'),
  handleValidationErrors
];

// Validacion de UUID
const validateUUID = [
  param('id')
    .isUUID().withMessage('ID invalido'),
  handleValidationErrors
];

// Validacion de paginacion
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina debe ser un numero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limite debe ser entre 1 y 100'),
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'name', 'email', 'status']).withMessage('Campo de ordenamiento invalido'),
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Orden debe ser asc o desc'),
  handleValidationErrors
];

// Validacion de cambio de password
const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirmar contraseña es requerido')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  handleValidationErrors
];

// Validacion de login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('El username es requerido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
  handleValidationErrors
];

// Validacion de registro (alias de validateUser)
const validateRegister = validateUser;

// Validacion de reset password
const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('El token es requerido'),
  body('password')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateContact,
  validateAppointment,
  validateUser,
  validateUserUpdate,
  validateService,
  validateBanner,
  validateClient,
  validatePromotion,
  validateSiteConfig,
  validateUUID,
  validatePagination,
  validateChangePassword,
  validateLogin,
  validateRegister,
  validateResetPassword
};
