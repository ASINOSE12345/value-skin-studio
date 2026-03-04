// VALUE SKIN STUDIO - API SERVICE
// Servicio para comunicacion con el backend

const ApiService = (() => {
  // Configuracion
  const BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/v1'
    : '/api/v1';

  const LEGACY_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

  // Token de autenticacion
  let authToken = localStorage.getItem('auth_token');

  // Headers base
  const getHeaders = (includeAuth = false) => {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  };

  // Manejador de errores
  const handleResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la solicitud');
    }

    return data;
  };

  // Metodos HTTP
  const get = async (endpoint, auth = false) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(auth)
    });
    return handleResponse(response);
  };

  const post = async (endpoint, data, auth = false) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(auth),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  };

  const put = async (endpoint, data, auth = false) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(auth),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  };

  const del = async (endpoint, auth = false) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(auth)
    });
    return handleResponse(response);
  };

  // Upload de archivos
  const upload = async (endpoint, formData, auth = true) => {
    const headers = {};
    if (auth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(response);
  };

  // =====================================================
  // AUTENTICACION
  // =====================================================
  const auth = {
    login: async (email, password) => {
      const result = await post('/auth/login', { email, password });
      if (result.success && result.data.token) {
        authToken = result.data.token;
        localStorage.setItem('auth_token', authToken);
        if (result.data.refreshToken) {
          localStorage.setItem('refresh_token', result.data.refreshToken);
        }
      }
      return result;
    },

    logout: () => {
      authToken = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    },

    isAuthenticated: () => !!authToken,

    getUser: () => get('/auth/me', true),

    updateProfile: (data) => put('/auth/profile', data, true),

    changePassword: (currentPassword, newPassword) =>
      put('/auth/password', { currentPassword, newPassword }, true)
  };

  // =====================================================
  // CONFIGURACION DEL SITIO
  // =====================================================
  const config = {
    getPublic: () => get('/config'),
    getLogo: () => get('/config/logo'),
    getContact: () => get('/config/contact'),
    getSocial: () => get('/config/social'),
    getSchedule: () => get('/config/schedule')
  };

  // =====================================================
  // BANNERS
  // =====================================================
  const banners = {
    getActive: () => get('/banners'),
    getHero: () => get('/banners/hero'),
    getBySection: (section) => get(`/banners/section/${section}`)
  };

  // =====================================================
  // SERVICIOS
  // =====================================================
  const services = {
    getActive: () => get('/services'),
    getFeatured: () => get('/services/featured'),
    getCategories: () => get('/services/categories'),
    getByCategory: (category) => get(`/services/category/${category}`),
    getBySlug: (slug) => get(`/services/slug/${slug}`),
    getById: (id) => get(`/services/${id}`),
    search: (query) => get(`/services/search?q=${encodeURIComponent(query)}`)
  };

  // =====================================================
  // PROMOCIONES
  // =====================================================
  const promotions = {
    getActive: () => get('/promotions'),
    getHome: () => get('/promotions/home'),
    validateCode: (code, purchaseAmount = 0) =>
      post('/promotions/validate', { code, purchaseAmount }),
    getByCode: (code) => get(`/promotions/code/${code}`)
  };

  // =====================================================
  // CONTENIDO DINAMICO
  // =====================================================
  const content = {
    getSections: () => get('/content/sections'),
    getBySection: (section) => get(`/content/${section}`),
    getFormatted: (section) => get(`/content/${section}/formatted`),
    get: (section, key) => get(`/content/${section}/${key}`)
  };

  // =====================================================
  // CONTACTO (Legacy compatible)
  // =====================================================
  const contact = {
    send: async (data) => {
      // Usar endpoint legacy para compatibilidad
      const response = await fetch(`${LEGACY_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }
  };

  // =====================================================
  // CITAS (Legacy compatible)
  // =====================================================
  const appointments = {
    create: async (data) => {
      const response = await fetch(`${LEGACY_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }
  };

  // API publica
  return {
    auth,
    config,
    banners,
    services,
    promotions,
    content,
    contact,
    appointments,
    // Metodos HTTP directos
    get,
    post,
    put,
    delete: del,
    upload,
    // Utilidades
    setToken: (token) => {
      authToken = token;
      localStorage.setItem('auth_token', token);
    },
    getToken: () => authToken,
    BASE_URL,
    LEGACY_URL
  };
})();

// Exportar globalmente
window.ApiService = ApiService;
