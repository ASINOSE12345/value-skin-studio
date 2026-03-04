// Rutas de autenticacion
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { authenticate } = require('../../middleware/auth');
const { validateLogin, validateRegister, validateResetPassword } = require('../../middleware/validate');

// POST /api/v1/auth/login - Iniciar sesion
router.post('/login', validateLogin, authController.login);

// POST /api/v1/auth/register - Registrar usuario (solo para setup inicial)
router.post('/register', validateRegister, authController.register);

// POST /api/v1/auth/logout - Cerrar sesion
router.post('/logout', authenticate, authController.logout);

// POST /api/v1/auth/refresh - Refrescar token
router.post('/refresh', authController.refreshToken);

// POST /api/v1/auth/forgot-password - Solicitar reset de password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/v1/auth/reset-password - Resetear password con token
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// GET /api/v1/auth/me - Obtener usuario actual
router.get('/me', authenticate, authController.getCurrentUser);

// PUT /api/v1/auth/profile - Actualizar perfil
router.put('/profile', authenticate, authController.updateProfile);

// PUT /api/v1/auth/password - Cambiar password
router.put('/password', authenticate, authController.changePassword);

// GET /api/v1/auth/verify - Verificar token
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;
