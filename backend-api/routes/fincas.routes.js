const express = require('express');
const router = express.Router();
const {
    obtenerFincas,
    crearFinca,
    actualizarFinca,
    eliminarFinca
} = require('../controllers/fincas.controller');

// GET /api/fincas - Listar fincas con filtros opcionales (email, search, municipio) y estadísticas
router.get('/', obtenerFincas);

// POST /api/fincas - Crear o georreferenciar una finca
router.post('/', crearFinca);

// PUT /api/fincas/:id - Actualizar datos de una finca
router.put('/:id', actualizarFinca);

// DELETE /api/fincas/:id - Eliminar finca
router.delete('/:id', eliminarFinca);

module.exports = router;
