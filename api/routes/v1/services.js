// Rutas publicas de servicios
const express = require('express');
const router = express.Router();
const serviceController = require('../../controllers/serviceController');

// GET /api/v1/services - Obtener servicios activos
router.get('/', serviceController.getActiveServices);

// GET /api/v1/services/featured - Obtener servicios destacados
router.get('/featured', serviceController.getFeaturedServices);

// GET /api/v1/services/categories - Obtener categorias
router.get('/categories', serviceController.getCategories);

// GET /api/v1/services/search - Buscar servicios
router.get('/search', serviceController.searchServices);

// GET /api/v1/services/category/:category - Obtener por categoria
router.get('/category/:category', serviceController.getServicesByCategory);

// GET /api/v1/services/slug/:slug - Obtener por slug
router.get('/slug/:slug', serviceController.getServiceBySlug);

// GET /api/v1/services/:id - Obtener por ID
router.get('/:id', serviceController.getServicePublic);

module.exports = router;
