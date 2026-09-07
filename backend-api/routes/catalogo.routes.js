// backend-api/routes/catalogo.routes.js
const express = require('express');
const router = express.Router();
const { obtenerCatalogo, crearCatalogoItem } = require('../controllers/catalogo.controller');

// GET /api/catalogo - Obtener servicios
router.get('/', obtenerCatalogo);

// POST /api/catalogo - Registrar un nuevo servicio
router.post('/', crearCatalogoItem);

module.exports = router;