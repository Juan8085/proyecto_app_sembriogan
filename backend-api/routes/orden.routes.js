const express = require('express');
const router = express.Router();
const { 
    crearOrden, 
    obtenerOrdenes, 
    obtenerResumenFinanciero 
} = require('../controllers/orden.controller');

router.post('/', crearOrden);
router.get('/', obtenerOrdenes);
router.get('/resumen-financiero', obtenerResumenFinanciero);

module.exports = router;