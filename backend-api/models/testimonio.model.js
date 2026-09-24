const { Schema, model } = require('mongoose');

const TestimonioSchema = new Schema({
    nombre: { type: String, required: true },
    rol: { type: String, default: 'Productor Asociado' },
    mensaje: { type: String, required: true },
    aprobado: { type: Boolean, default: false } // false = pendiente, true = publicado
}, {
    versionKey: false
});

module.exports = model('Testimonio', TestimonioSchema);