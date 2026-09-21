const express = require('express');
const router = express.Router();
const { 
    registrarUsuario, 
    loginUsuario, 
    obtenerUsuarios, 
    actualizarUsuarioAdmin 
} = require('../controllers/auth.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

// Rutas públicas
router.post('/login', loginUsuario);
router.post('/registro', registrarUsuario);

// Rutas protegidas exclusivas para Administradores
router.get('/usuarios', verificarToken, esAdmin, obtenerUsuarios);
router.put('/usuarios/:id', verificarToken, esAdmin, actualizarUsuarioAdmin);

module.exports = router;