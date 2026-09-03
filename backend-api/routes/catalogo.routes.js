const express = require('express');
const router = express.Router();
const { obtenerCatalogo } = require('../controllers/catalogo.controller');

// Ruta GET para obtener el catálogo
router.get('/', obtenerCatalogo);

module.exports = router;