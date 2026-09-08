const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { obtenerCatalogo, crearCatalogoItem } = require('../controllers/catalogo.controller');

router.get('/', obtenerCatalogo);
router.post('/', upload.single('imagen'), crearCatalogoItem);

module.exports = router;