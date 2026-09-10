const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { obtenerCarrusel, subirImagenCarrusel, eliminarImagen } = require('../controllers/carrusel.controller');

router.get('/', obtenerCarrusel);
// Reutilizamos el 'upload.single' con el nombre de campo 'imagen'
router.post('/', upload.single('imagen'), subirImagenCarrusel);
router.delete('/:id', eliminarImagen);

module.exports = router;