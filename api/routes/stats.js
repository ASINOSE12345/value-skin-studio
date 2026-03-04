// Rutas de Estadísticas
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Appointment = require('../models/Appointment');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Obtener dashboard stats (solo admin)
router.get('/dashboard', verifyToken, isAdmin, (req, res) => {
  try {
    const contacts = Contact.getAll();
    const appointments = Appointment.getAll();
    
    const stats = {
      contacts: {
        total: contacts.length,
        pending: contacts.filter(c => c.status === 'pending').length,
        contacted: contacts.filter(c => c.status === 'contacted').length,
        byType: {
          cliente: contacts.filter(c => c.type === 'cliente').length,
          hotel: contacts.filter(c => c.type === 'hotel').length,
          empresa: contacts.filter(c => c.type === 'empresa').length,
          escuela: contacts.filter(c => c.type === 'escuela').length,
        }
      },
      appointments: {
        total: appointments.length,
        pending: appointments.filter(a => a.status === 'pending').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        upcoming: Appointment.getUpcoming().length
      },
      recent: {
        contacts: contacts.slice(-5).reverse(),
        appointments: appointments.slice(-5).reverse()
      }
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;
