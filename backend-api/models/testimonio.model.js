const { Schema, model } = require('mongoose');

const TestimonioSchema = new Schema({
    productor: { type: String, required: true },
    finca: { type: String, required: true },
    comentario: { type: String, required: true },
    aprobado: { type: Boolean, default: false } // False por defecto hasta que el admin apruebe
}, {
    versionKey: false
});

module.exports = model('Testimonio', TestimonioSchema);