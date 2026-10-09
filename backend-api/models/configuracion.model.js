const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
    wompiPublicKey: {
        type: String,
        default: 'pub_test_1jKw2orNya3GdwqfTCl1wU6V0yS0mnnh'
    },
    wompiPrivateKey: {
        type: String,
        default: ''
    },
    wompiEventosSecret: {
        type: String,
        default: ''
    },
    wompiIntegridadSecret: {
        type: String,
        default: ''
    },
    telefonoWhatsapp: {
        type: String,
        default: '3106663472'
    }
}, { timestamps: true });

module.exports = mongoose.model('Configuracion', configuracionSchema);
