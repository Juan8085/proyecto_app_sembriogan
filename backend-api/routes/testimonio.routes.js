const express = require('express');
const router = express.Router();
const { 
    obtenerTestimoniosAdmin, 
    obtenerTestimoniosPublicos, 
    crearTestimonio, 
    aprobarTestimonio, 
    eliminarTestimonio 
} = require('../controllers/testimonio.controller');

router.get('/', obtenerTestimoniosAdmin);
router.get('/public', obtenerTestimoniosPublicos);
router.post('/', crearTestimonio);
router.put('/:id/aprobar', aprobarTestimonio);
router.delete('/:id', eliminarTestimonio);

module.exports = router;