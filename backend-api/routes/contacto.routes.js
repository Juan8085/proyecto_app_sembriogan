const express = require('express');
const router = express.Router();
const { obtenerContacto, actualizarContacto } = require('../controllers/contacto.controller');

router.get('/', obtenerContacto);
router.post('/', actualizarContacto); // Usa POST para crear/actualizar el registro único

module.exports = router;