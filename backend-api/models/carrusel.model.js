const mongoose = require('mongoose');

const carruselSchema = new mongoose.Schema({
    titulo: { type: String, required: false },
    descripcion: { type: String, required: false },
    imagenUrl: { type: String, required: true }, // Aquí guardaremos la ruta de la foto
    activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Carrusel', carruselSchema);