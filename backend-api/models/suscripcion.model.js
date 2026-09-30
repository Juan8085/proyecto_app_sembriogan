const mongoose = require('mongoose');

const suscripcionSchema = new mongoose.Schema({
    veterinarioId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    endpoint: { type: String, required: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('Suscripcion', suscripcionSchema);