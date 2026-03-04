// Utilidades y helpers generales

/**
 * Genera un slug a partir de un texto
 * @param {string} text - Texto a convertir
 * @returns {string} Slug generado
 */
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Genera un ID unico
 * @param {string} prefix - Prefijo opcional
 * @returns {string} ID generado
 */
const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}-${timestamp}${random}` : `${timestamp}${random}`;
};

/**
 * Formatea una fecha para mostrar
 * @param {Date|string} date - Fecha a formatear
 * @param {string} locale - Locale para formato
 * @returns {string} Fecha formateada
 */
const formatDate = (date, locale = 'es-ES') => {
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatea una fecha y hora
 * @param {Date|string} date - Fecha a formatear
 * @param {string} locale - Locale para formato
 * @returns {string} Fecha y hora formateada
 */
const formatDateTime = (date, locale = 'es-ES') => {
  const d = new Date(date);
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea un numero como moneda
 * @param {number} amount - Cantidad
 * @param {string} currency - Codigo de moneda
 * @param {string} locale - Locale para formato
 * @returns {string} Cantidad formateada
 */
const formatCurrency = (amount, currency = 'MXN', locale = 'es-MX') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} Es valido
 */
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valida un telefono (formato mexicano)
 * @param {string} phone - Telefono a validar
 * @returns {boolean} Es valido
 */
const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 12;
};

/**
 * Sanitiza texto para prevenir XSS
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Trunca un texto a cierta longitud
 * @param {string} text - Texto a truncar
 * @param {number} length - Longitud maxima
 * @param {string} suffix - Sufijo
 * @returns {string} Texto truncado
 */
const truncateText = (text, length = 100, suffix = '...') => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

/**
 * Genera un color hexadecimal aleatorio
 * @returns {string} Color hexadecimal
 */
const randomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Calcula la diferencia en dias entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number} Diferencia en dias
 */
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2 - d1);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si una fecha es hoy
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} Es hoy
 */
const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

/**
 * Verifica si una fecha es futura
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} Es futura
 */
const isFuture = (date) => {
  return new Date(date) > new Date();
};

/**
 * Verifica si una fecha es pasada
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} Es pasada
 */
const isPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Capitaliza la primera letra
 * @param {string} text - Texto
 * @returns {string} Texto capitalizado
 */
const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitaliza cada palabra
 * @param {string} text - Texto
 * @returns {string} Texto con palabras capitalizadas
 */
const capitalizeWords = (text) => {
  if (!text) return '';
  return text.split(' ').map(capitalize).join(' ');
};

/**
 * Genera un codigo de promocion aleatorio
 * @param {number} length - Longitud del codigo
 * @returns {string} Codigo generado
 */
const generatePromoCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Parsea query params para paginacion
 * @param {object} query - Query params
 * @returns {object} Opciones de paginacion
 */
const parsePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Construye respuesta paginada
 * @param {array} data - Datos
 * @param {number} total - Total de registros
 * @param {object} pagination - Opciones de paginacion
 * @returns {object} Respuesta paginada
 */
const buildPaginatedResponse = (data, total, { page, limit }) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * Elimina propiedades undefined de un objeto
 * @param {object} obj - Objeto a limpiar
 * @returns {object} Objeto limpio
 */
const removeUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
};

/**
 * Espera un tiempo determinado
 * @param {number} ms - Milisegundos
 * @returns {Promise} Promesa
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Reintenta una funcion async
 * @param {function} fn - Funcion a ejecutar
 * @param {number} retries - Numero de reintentos
 * @param {number} delay - Delay entre reintentos
 * @returns {Promise} Resultado
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

module.exports = {
  generateSlug,
  generateId,
  formatDate,
  formatDateTime,
  formatCurrency,
  isValidEmail,
  isValidPhone,
  sanitizeText,
  truncateText,
  randomColor,
  daysBetween,
  isToday,
  isFuture,
  isPast,
  capitalize,
  capitalizeWords,
  generatePromoCode,
  parsePaginationParams,
  buildPaginatedResponse,
  removeUndefined,
  sleep,
  retry
};
