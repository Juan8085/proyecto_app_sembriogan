const { Schema, model } = require('mongoose');

const FincaSchema = new Schema({
    nombreFinca: { type: String, required: true },
    propietarioNombre: { type: String, required: true },
    propietarioEmail: { type: String, required: false, lowercase: true, trim: true },
    propietarioTelefono: { type: String, required: false },
    departamento: { type: String, default: 'Huila' },
    municipio: { type: String, required: true },
    vereda: { type: String, default: '' },
    coordenadas: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    numeroAnimales: { type: Number, default: 0 },
    hectareas: { type: Number, default: 0 },
    tipoProduccion: { 
        type: String, 
        enum: ['Leche', 'Carne', 'Doble Propósito', 'Genética/Biotecnología', 'Cría y Levante', 'Otro'],
        default: 'Doble Propósito' 
    },
    notas: { type: String, default: '' },
    registradoPor: { type: String, default: 'Cliente' }, // 'Cliente', 'Veterinario', 'Admin'
    estado: { type: Boolean, default: true }
}, {
    timestamps: true,
    versionKey: false
});

FincaSchema.index({ propietarioEmail: 1 });
FincaSchema.index({ municipio: 1 });

module.exports = model('Finca', FincaSchema);
