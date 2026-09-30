const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { obtenerNosotros, actualizarNosotros } = require('../controllers/nosotros.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'nosotros-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.get('/', obtenerNosotros);
// Usamos PUT porque actualizaremos siempre el mismo registro
router.put('/', verificarToken, upload.single('imagen'), actualizarNosotros); 

module.exports = router;