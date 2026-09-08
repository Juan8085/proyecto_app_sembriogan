const express = require('express');
const router = express.Router();
const { obtenerSolicitudes, crearSolicitud, actualizarEstadoSolicitud } = require('../controllers/solicitudes.controller');

// GET /api/solicitudes - Listar todas
router.get('/', obtenerSolicitudes);

// POST /api/solicitudes - Crear una nueva
router.post('/', crearSolicitud);

// PUT /api/solicitudes/:id - Actualizar estado (¡Esta es la nueva ruta!)
router.put('/:id', actualizarEstadoSolicitud);

module.exports = router;
