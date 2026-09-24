const express = require('express');
const router = express.Router();
const {
    obtenerTestimoniosPublicos,
    obtenerTodosTestimoniosAdmin,
    crearTestimonio,
    cambiarEstadoTestimonio,
    eliminarTestimonio
} = require('../controllers/testimonio.controller');

router.get('/', obtenerTestimoniosPublicos);
router.get('/admin/todos', obtenerTodosTestimoniosAdmin);
router.post('/', crearTestimonio);
router.put('/:id', cambiarEstadoTestimonio);
router.delete('/:id', eliminarTestimonio);

module.exports = router;