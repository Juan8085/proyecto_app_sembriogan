const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { 
    obtenerCatalogo, 
    crearCatalogoItem, 
    eliminarCatalogoItem,
    actualizarCatalogoItem,
    crearCatalogoMasivo
} = require('../controllers/catalogo.controller');

router.get('/', obtenerCatalogo);
router.post('/masivo', crearCatalogoMasivo);
router.post('/', upload.single('imagen'), crearCatalogoItem);
router.put('/:id', upload.single('imagen'), actualizarCatalogoItem); // <--- NUEVA RUTA PUT PARA EDITAR
router.delete('/:id', eliminarCatalogoItem);

module.exports = router;