const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario } = require('../controllers/auth.controller');
const { verificarToken, esAdmin } = require('./../middlewares/auth.middleware');

router.post('/login', loginUsuario);

// Permitimos la petición al endpoint de registro
router.post('/registro', registrarUsuario);

module.exports = router;