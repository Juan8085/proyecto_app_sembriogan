const express = require('express');
const router = express.Router();
const { obtenerConfiguracion, actualizarConfiguracion } = require('../controllers/configuracion.controller');

// Estas rutas podrían ser protegidas con verificarToken, pero por simplicidad para la demo se dejan abiertas o parcialmente protegidas
router.get('/', obtenerConfiguracion);
router.post('/', actualizarConfiguracion);

module.exports = router;
