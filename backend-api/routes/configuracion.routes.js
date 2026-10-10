const express = require('express');
const router = express.Router();
const { obtenerConfiguracion, actualizarConfiguracion, generarFirmaWompi } = require('../controllers/configuracion.controller');

// Estas rutas podrían ser protegidas con verificarToken, pero por simplicidad para la demo se dejan abiertas o parcialmente protegidas
router.get('/', obtenerConfiguracion);
router.post('/', actualizarConfiguracion);
router.post('/generar-firma', generarFirmaWompi);

module.exports = router;
