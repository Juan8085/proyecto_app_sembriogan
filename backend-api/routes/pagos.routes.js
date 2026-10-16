const express = require('express');
const router = express.Router();
const { webhookWompi, verificarTransaccion, confirmarWompiRedirect } = require('../controllers/pagos.controller');

// Webhook oficial de Wompi
router.post('/webhook', webhookWompi);

// Verificación directa de transacciones (cliente web y callbacks)
router.post('/verificar-transaccion', verificarTransaccion);

// Redirección de Wompi para móviles y navegador
router.get('/confirmar-wompi', confirmarWompiRedirect);

module.exports = router;
