const express = require('express');
const router = express.Router();
const { consultarIA } = require('../controllers/ia.controller');

router.post('/chat', consultarIA);

module.exports = router;