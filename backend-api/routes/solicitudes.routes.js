const express = require('express');
const router = express.Router();
const { obtenerSolicitudes, crearSolicitud } = require('../controllers/solicitudes.controller');

// GET /api/solicitudes - Listar todas
router.get('/', obtenerSolicitudes);

// POST /api/solicitudes - Crear una nueva
router.post('/', crearSolicitud);

module.exports = router;