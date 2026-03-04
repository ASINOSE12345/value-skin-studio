// Controlador de Turnos/Citas
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

exports.create = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const appointment = Appointment.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      message: 'Turno creado exitosamente',
      data: appointment 
    });
  } catch (error) {
    console.error('Error creando turno:', error);
    res.status(500).json({ success: false, message: 'Error al crear el turno' });
  }
};

exports.getAll = (req, res) => {
  try {
    const appointments = Appointment.getAll();
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo turnos' });
  }
};

exports.getById = (req, res) => {
  try {
    const appointment = Appointment.getById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado' });
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo turno' });
  }
};

exports.update = (req, res) => {
  try {
    const appointment = Appointment.update(req.params.id, req.body);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado' });
    }
    res.json({ success: true, message: 'Turno actualizado', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error actualizando turno' });
  }
};

exports.delete = (req, res) => {
  try {
    const deleted = Appointment.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado' });
    }
    res.json({ success: true, message: 'Turno eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error eliminando turno' });
  }
};

exports.getUpcoming = (req, res) => {
  try {
    const appointments = Appointment.getUpcoming();
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo turnos próximos' });
  }
};

module.exports = exports;
