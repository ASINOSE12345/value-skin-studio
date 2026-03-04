// Rutas de Contacto
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const contactController = require('../controllers/contactController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Validaciones
const contactValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('phone').trim().notEmpty().withMessage('El teléfono es requerido'),
  body('type').isIn(['cliente', 'hotel', 'empresa', 'escuela', 'otro']).withMessage('Tipo inválido'),
];

// Rutas públicas
router.post('/', contactValidation, contactController.create);

// Rutas protegidas (solo admin)
router.get('/', verifyToken, isAdmin, contactController.getAll);
router.get('/:id', verifyToken, isAdmin, contactController.getById);
router.put('/:id', verifyToken, isAdmin, contactController.update);
router.delete('/:id', verifyToken, isAdmin, contactController.delete);

module.exports = router;
