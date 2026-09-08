const { Schema, model } = require('mongoose');

const CatalogoSchema = new Schema({
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true },
    costo: { type: Number, required: true },
    imagen: { type: String, required: false } // Ruta de la imagen guardada
}, {
    versionKey: false
});

module.exports = model('Catalogo', CatalogoSchema);