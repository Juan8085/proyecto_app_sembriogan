const { Schema, model } = require('mongoose');

const CarruselSchema = new Schema({
    imagen: { type: String, required: true },
    activa: { type: Boolean, default: true }
}, {
    versionKey: false
});

module.exports = model('Carrusel', CarruselSchema);