const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario } = require('../controllers/auth.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

// Login es público (necesitan entrar para obtener el token)
router.post('/login', loginUsuario);

// El registro de nuevos usuarios (Veterinarios/Admin) ahora está protegido y solo lo puede hacer un Admin
router.post('/registro', verificarToken, esAdmin, registrarUsuario);

module.exports = router;