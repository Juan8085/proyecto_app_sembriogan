const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario } = require('../controllers/auth.controller');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;