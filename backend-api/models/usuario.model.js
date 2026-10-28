const { Schema, model } = require('mongoose');

const UsuarioSchema = new Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { 
        type: String, 
        required: true, 
        enum: ['Admin', 'Veterinario', 'Cliente'],
        default: 'Cliente'
    },
    tipoProduccion: { 
        type: String, 
        enum: ['Doble Propósito', 'Leche', 'Carne', 'Genética/Biotecnología', 'Cría y Levante', 'Otro'],
        default: 'Doble Propósito'
    },
    fincaPrincipal: { type: String, default: '' },
    municipio: { type: String, default: 'Neiva' },
    telefono: { type: String, default: '' },
    estado: { type: Boolean, default: true } // Para activar/desactivar usuarios
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = model('Usuario', UsuarioSchema);