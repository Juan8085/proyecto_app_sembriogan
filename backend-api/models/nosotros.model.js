const mongoose = require('mongoose');

const nosotrosSchema = new mongoose.Schema({
    titulo: { type: String, default: '' },
    descripcion: { type: String, default: '' },
    imagenUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Nosotros', nosotrosSchema);