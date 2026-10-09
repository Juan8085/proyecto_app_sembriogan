const express = require('express');
const router = express.Router();
const { obtenerRegistros, crearRegistro, actualizarPrenez, actualizarPaso } = require('../controllers/registro_genetico.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// Todas estas rutas requieren estar logueado (Sea Admin o Veterinario)
router.get('/', obtenerRegistros);
router.post('/', verificarToken, crearRegistro);
router.put('/:id', verificarToken, actualizarPrenez);
router.put('/:id/prenez', verificarToken, actualizarPrenez);
router.put('/:id/paso', verificarToken, actualizarPaso);

module.exports = router;