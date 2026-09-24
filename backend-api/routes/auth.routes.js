const express = require('express');
const router = express.Router();
const { 
    registrarUsuario, 
    loginUsuario, 
    googleLogin, 
    obtenerUsuarios, 
    actualizarUsuarioAdmin 
} = require('../controllers/auth.controller');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/google', googleLogin); // <--- NUEVA RUTA PARA GOOGLE
router.get('/usuarios', obtenerUsuarios);
router.put('/usuarios/:id', actualizarUsuarioAdmin);

module.exports = router;