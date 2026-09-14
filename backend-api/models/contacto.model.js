const { Schema, model } = require('mongoose');

const ContactoSchema = new Schema({
    sucursal: { type: String, required: true },
    direccion: { type: String, required: true },
    telefono: { type: String, required: true },
    email: { type: String, required: true },
    whatsapp: { type: String, required: true }
}, { versionKey: false });

module.exports = model('Contacto', ContactoSchema);