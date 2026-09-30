const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { obtenerCarrusel, crearCarrusel, eliminarCarrusel } = require('../controllers/carrusel.controller');

// Importar seguridad (asegúrate de que la ruta al middleware sea la correcta)
const { verificarToken } = require('../middlewares/auth.middleware');

// ⚙️ Configuración de Multer para guardar las imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Se guardará en tu carpeta uploads existente
    },
    filename: function (req, file, cb) {
        // Renombramos el archivo para evitar duplicados: carrusel-123456789.jpg
        cb(null, 'carrusel-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rutas Públicas
router.get('/', obtenerCarrusel);

// Rutas Privadas (Solo el Admin en React puede subir o borrar)
router.post('/', verificarToken, upload.single('imagen'), crearCarrusel);
router.delete('/:id', verificarToken, eliminarCarrusel);

module.exports = router;