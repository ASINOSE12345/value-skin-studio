// Rutas admin de clientes
const express = require('express');
const router = express.Router();
const clientController = require('../../../controllers/clientController');
const { authenticate } = require('../../../middleware/auth');
const { isAdmin, isEditor } = require('../../../middleware/roles');
const { uploadAvatar } = require('../../../config/cloudinary');
const { validateClient } = require('../../../middleware/validate');

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/v1/admin/clients - Obtener todos los clientes
router.get('/', isEditor, clientController.getAllClients);

// GET /api/v1/admin/clients/search - Buscar clientes
router.get('/search', isEditor, clientController.searchClients);

// GET /api/v1/admin/clients/stats - Obtener estadisticas
router.get('/stats', isEditor, clientController.getClientStats);

// GET /api/v1/admin/clients/tags - Obtener todos los tags
router.get('/tags', isEditor, clientController.getAllTags);

// GET /api/v1/admin/clients/export - Exportar clientes
router.get('/export', isAdmin, clientController.exportClients);

// GET /api/v1/admin/clients/tag/:tag - Obtener clientes por tag
router.get('/tag/:tag', isEditor, clientController.getClientsByTag);

// GET /api/v1/admin/clients/email/:email - Obtener cliente por email
router.get('/email/:email', isEditor, clientController.getClientByEmail);

// GET /api/v1/admin/clients/:id - Obtener cliente por ID
router.get('/:id', isEditor, clientController.getClientById);

// GET /api/v1/admin/clients/:id/history - Obtener historial del cliente
router.get('/:id/history', isEditor, clientController.getClientHistory);

// POST /api/v1/admin/clients - Crear cliente
router.post('/', isAdmin, uploadAvatar.single('avatar'), validateClient, clientController.createClient);

// POST /api/v1/admin/clients/import - Importar clientes
router.post('/import', isAdmin, clientController.importClients);

// POST /api/v1/admin/clients/upload - Subir avatar
router.post('/upload', isAdmin, uploadAvatar.single('avatar'), clientController.uploadAvatar);

// PUT /api/v1/admin/clients/:id - Actualizar cliente
router.put('/:id', isAdmin, uploadAvatar.single('avatar'), clientController.updateClient);

// DELETE /api/v1/admin/clients/:id - Eliminar cliente
router.delete('/:id', isAdmin, clientController.deleteClient);

// POST /api/v1/admin/clients/:id/history - Agregar historial
router.post('/:id/history', isAdmin, clientController.addClientHistory);

// POST /api/v1/admin/clients/:id/tags - Agregar tags
router.post('/:id/tags', isAdmin, clientController.addClientTags);

// DELETE /api/v1/admin/clients/:id/tags - Remover tags
router.delete('/:id/tags', isAdmin, clientController.removeClientTags);

// PATCH /api/v1/admin/clients/:id/spent - Actualizar total gastado
router.patch('/:id/spent', isAdmin, clientController.updateTotalSpent);

// PATCH /api/v1/admin/clients/:id/contact - Actualizar ultimo contacto
router.patch('/:id/contact', isAdmin, clientController.updateLastContact);

module.exports = router;
