const express = require('express');
const router = express.Router();
const { webhookWompi } = require('../controllers/pagos.controller');

router.post('/webhook', webhookWompi);

module.exports = router;
