// Controlador de Estadisticas
const Contact = require('../models/Contact');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Promotion = require('../models/Promotion');
const Service = require('../models/Service');
const Banner = require('../models/Banner');
const { asyncHandler } = require('../middleware/errorHandler');

// Obtener resumen general del dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    contactStats,
    appointmentStats,
    clientStats,
    promotionStats,
    serviceCount,
    bannerCount
  ] = await Promise.all([
    Contact.getStats().catch(() => ({ total: 0, pending: 0 })),
    Appointment.getStats().catch(() => ({ total: 0, upcoming: 0 })),
    Client.count().catch(() => 0),
    Promotion.count(true).catch(() => 0),
    Service.count(true).catch(() => 0),
    Banner.count(true).catch(() => 0)
  ]);

  res.json({
    success: true,
    data: {
      contacts: {
        total: contactStats.total || 0,
        pending: contactStats.pending || 0,
        today: contactStats.today || 0
      },
      appointments: {
        total: appointmentStats.total || 0,
        upcoming: appointmentStats.upcoming || 0,
        today: appointmentStats.today || 0
      },
      clients: {
        total: clientStats || 0
      },
      promotions: {
        active: promotionStats || 0
      },
      services: {
        active: serviceCount || 0
      },
      banners: {
        active: bannerCount || 0
      }
    }
  });
});

// Obtener estadisticas de contactos
const getContactStats = asyncHandler(async (req, res) => {
  const stats = await Contact.getStats();

  res.json({
    success: true,
    data: stats
  });
});

// Obtener estadisticas de citas
const getAppointmentStats = asyncHandler(async (req, res) => {
  const stats = await Appointment.getStats();

  res.json({
    success: true,
    data: stats
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

// Obtener estadisticas de servicios
const getServiceStats = asyncHandler(async (req, res) => {
  const total = await Service.count();
  const active = await Service.count(true);
  const categories = await Service.getCategories();

  const byCategory = {};
  for (const cat of categories) {
    const services = await Service.getByCategory(cat.category, true);
    byCategory[cat.category] = services.length;
  }

  res.json({
    success: true,
    data: {
      total,
      active,
      inactive: total - active,
      byCategory
    }
  });
});

// Obtener estadisticas de promociones
const getPromotionStats = asyncHandler(async (req, res) => {
  const total = await Promotion.count();
  const active = await Promotion.count(true);
  const promotions = await Promotion.getAll(true);

  let totalUsage = 0;
  let totalDiscounted = 0;

  promotions.forEach(p => {
    totalUsage += p.times_used || 0;
    totalDiscounted += p.total_discounted || 0;
  });

  res.json({
    success: true,
    data: {
      total,
      active,
      inactive: total - active,
      totalUsage,
      totalDiscounted
    }
  });
});

// Obtener actividad reciente
const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const [contactsResult, appointmentsResult] = await Promise.all([
    Contact.getAll().catch(() => ({ data: [] })),
    Appointment.getAll().catch(() => ({ data: [] }))
  ]);

  // Extraer arrays de los resultados (pueden ser objetos con data o arrays directos)
  const contacts = Array.isArray(contactsResult) ? contactsResult : (contactsResult?.data || []);
  const appointments = Array.isArray(appointmentsResult) ? appointmentsResult : (appointmentsResult?.data || []);

  // Combinar y ordenar por fecha
  const activities = [
    ...contacts.slice(0, 10).map(c => ({
      type: 'contact',
      id: c.id,
      title: `Nueva consulta de ${c.name || c.first_name || 'Cliente'}`,
      description: c.subject || c.message?.substring(0, 50) || '',
      date: c.created_at,
      status: c.status
    })),
    ...appointments.slice(0, 10).map(a => ({
      type: 'appointment',
      id: a.id,
      title: `Cita: ${a.client_name || a.name || 'Cliente'}`,
      description: `${a.service || 'Servicio'} - ${a.date || ''}`,
      date: a.created_at,
      status: a.status
    }))
  ];

  // Ordenar por fecha descendente
  activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  res.json({
    success: true,
    data: activities.slice(0, parseInt(limit))
  });
});

// Obtener metricas de rendimiento
const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // Calcular fecha de inicio segun periodo
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [contactsResult, appointmentsResult] = await Promise.all([
    Contact.getAll().catch(() => ({ data: [] })),
    Appointment.getAll().catch(() => ({ data: [] }))
  ]);

  // Extraer arrays
  const contacts = Array.isArray(contactsResult) ? contactsResult : (contactsResult?.data || []);
  const appointments = Array.isArray(appointmentsResult) ? appointmentsResult : (appointmentsResult?.data || []);

  // Filtrar por periodo
  const filteredContacts = contacts.filter(c =>
    c.created_at && new Date(c.created_at) >= startDate
  );
  const filteredAppointments = appointments.filter(a =>
    a.created_at && new Date(a.created_at) >= startDate
  );

  // Agrupar por dia
  const contactsByDay = {};
  const appointmentsByDay = {};

  filteredContacts.forEach(c => {
    const day = new Date(c.created_at).toISOString().split('T')[0];
    contactsByDay[day] = (contactsByDay[day] || 0) + 1;
  });

  filteredAppointments.forEach(a => {
    const day = new Date(a.created_at).toISOString().split('T')[0];
    appointmentsByDay[day] = (appointmentsByDay[day] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      period,
      contacts: {
        total: filteredContacts.length,
        byDay: contactsByDay
      },
      appointments: {
        total: filteredAppointments.length,
        byDay: appointmentsByDay
      }
    }
  });
});

// Obtener top servicios
const getTopServices = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const appointmentsResult = await Appointment.getAll().catch(() => ({ data: [] }));
  const appointments = Array.isArray(appointmentsResult) ? appointmentsResult : (appointmentsResult?.data || []);

  // Contar servicios
  const serviceCounts = {};
  appointments.forEach(a => {
    if (a.service) {
      serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
    }
  });

  // Ordenar y limitar
  const topServices = Object.entries(serviceCounts)
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, parseInt(limit));

  res.json({
    success: true,
    data: topServices
  });
});

module.exports = {
  getDashboardStats,
  getContactStats,
  getAppointmentStats,
  getClientStats,
  getServiceStats,
  getPromotionStats,
  getRecentActivity,
  getPerformanceMetrics,
  getTopServices
};
