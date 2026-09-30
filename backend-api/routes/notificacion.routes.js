const express = require('express');
const router = express.Router();
// Importamos la nueva función probarNotificacion
const { obtenerClavePublica, suscribir, probarNotificacion } = require('../controllers/notificacion.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.get('/clave-publica', obtenerClavePublica);
router.post('/suscribir', verificarToken, suscribir);

// --- NUEVA RUTA DE PRUEBA ---
router.post('/prueba', verificarToken, probarNotificacion);

module.exports = router;