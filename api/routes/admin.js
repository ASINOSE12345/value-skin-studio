// Rutas de Administración
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const { generateToken, verifyToken, isAdmin } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, passwordLength: password?.length });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    const user = await User.validatePassword(username, password);
    console.log('Validation result:', user ? 'User found' : 'Invalid credentials');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Verificar token
router.get('/verify', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Crear usuario (solo admin)
router.post('/users', verifyToken, isAdmin, [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
], async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, message: 'Usuario creado', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creando usuario' });
  }
});

// Listar usuarios (solo admin)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo usuarios' });
  }
});

module.exports = router;
