const express = require('express');
const router = express.Router();
const { 
    registrarUsuario, 
    loginUsuario, 
    googleLogin, 
    obtenerUsuarios, 
    actualizarUsuarioAdmin,
    verificarSesion
} = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/google', googleLogin);
router.get('/usuarios', obtenerUsuarios);
router.get('/verificar', verificarToken, verificarSesion);
router.put('/usuarios/:id', actualizarUsuarioAdmin);

module.exports = router;