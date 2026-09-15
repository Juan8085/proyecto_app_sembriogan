const express = require('express');
const router = express.Router();
const { obtenerSolicitudes, crearSolicitud, actualizarEstado } = require('../controllers/solicitudes.controller');

// Importamos a nuestro vigilante
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

// 🔒 Rutas Protegidas:
// Para ver las solicitudes, OBLIGAMOS a que tenga un token válido (verificarToken)
router.get('/', verificarToken, obtenerSolicitudes);

// Para actualizar estados, OBLIGAMOS a que tenga un token Y que además sea Administrador
router.put('/:id', verificarToken, esAdmin, actualizarEstado);

// 🔓 Rutas Públicas:
// Cualquiera puede CREAR una solicitud (ya sea desde la web pública con Wompi o el formulario)
router.post('/', crearSolicitud);

module.exports = router;