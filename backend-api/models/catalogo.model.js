const { Schema, model } = require('mongoose');

const CatalogoSchema = new Schema({
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true },
    costo: { type: Number, required: true },
    imagen: { type: String, required: false },
    esServicio: { type: Boolean, default: true }, // true = Servicio (N/A stock), false = Producto
    stock: { type: Number, default: 0 } // Unidades disponibles si es producto
}, {
    versionKey: false
});

module.exports = model('Catalogo', CatalogoSchema);