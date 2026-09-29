const express = require('express');
const router = express.Router();
const { consultarIA } = require('../controllers/ia.controller');

// 1. IMPORTAR EL MIDDLEWARE DE SEGURIDAD
// (Ajusta esta ruta dependiendo de cómo se llame tu archivo de middleware, 
// usualmente es '../middlewares/auth.middleware' o '../middleware/auth')
const { verificarToken } = require('../middlewares/auth.middleware'); 

// 2. RUTA CORREGIDA: Como en server.js ya tiene el prefijo '/api/ia', aquí solo va '/consultar'
router.post('/consultar', verificarToken, consultarIA);

module.exports = router;