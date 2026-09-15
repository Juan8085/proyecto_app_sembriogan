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
    estado: { type: Boolean, default: true } // Para activar/desactivar usuarios
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = model('Usuario', UsuarioSchema);