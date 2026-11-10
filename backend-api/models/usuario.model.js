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
    inventarioBovino: { type: Number, default: 0 }, // Número de cabezas de ganado bovino
    hectareas: { type: Number, default: 0 },        // Área total de la propiedad en hectáreas
    estado: { type: Boolean, default: true } // Para activar/desactivar usuarios
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = model('Usuario', UsuarioSchema);