// Rutas de Turnos/Citas
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Validaciones
const appointmentValidation = [
  body('clientName').trim().notEmpty().withMessage('El nombre es requerido'),
  body('clientEmail').isEmail().withMessage('Email inválido'),
  body('clientPhone').trim().notEmpty().withMessage('El teléfono es requerido'),
  body('service').trim().notEmpty().withMessage('El servicio es requerido'),
  body('date').isDate().withMessage('Fecha inválida'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida'),
];

// Rutas públicas
router.post('/', appointmentValidation, appointmentController.create);

// Rutas protegidas (solo admin)
router.get('/', verifyToken, isAdmin, appointmentController.getAll);
router.get('/upcoming', verifyToken, isAdmin, appointmentController.getUpcoming);
router.get('/:id', verifyToken, isAdmin, appointmentController.getById);
router.put('/:id', verifyToken, isAdmin, appointmentController.update);
router.delete('/:id', verifyToken, isAdmin, appointmentController.delete);

module.exports = router;
