const express = require('express');
const router = express.Router();
const { obtenerRegistros, crearRegistro, actualizarPrenez } = require('../controllers/registro_genetico.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// Todas estas rutas requieren estar logueado (Sea Admin o Veterinario)
router.get('/', verificarToken, obtenerRegistros);
router.post('/', verificarToken, crearRegistro);
router.put('/:id', verificarToken, actualizarPrenez);

module.exports = router;