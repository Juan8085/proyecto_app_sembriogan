// backend-api/models/catalogo.model.js
const { Schema, model } = require('mongoose');

const CatalogoSchema = new Schema({
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true },
    costo: { type: Number, required: true }
}, {
    versionKey: false
});

module.exports = model('Catalogo', CatalogoSchema);