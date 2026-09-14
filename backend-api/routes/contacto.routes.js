const express = require('express');
const router = express.Router();
const { obtenerContactos, crearContacto, eliminarContacto } = require('../controllers/contacto.controller');

router.get('/', obtenerContactos);
router.post('/', crearContacto);
router.delete('/:id', eliminarContacto);

module.exports = router;