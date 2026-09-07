// backend-api/models/solicitud.model.js
const { Schema, model } = require('mongoose');

const SolicitudSchema = new Schema({
    productor: { type: String, required: true },
    finca: { type: String, required: true },
    servicio: { type: String, required: true },
    estado: { type: String, default: 'Pendiente' },
    fecha: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, {
    versionKey: false
});

module.exports = model('Solicitud', SolicitudSchema);