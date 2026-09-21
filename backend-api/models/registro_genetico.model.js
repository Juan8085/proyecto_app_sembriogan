const { Schema, model } = require('mongoose');

const RegistroGeneticoSchema = new Schema({
    productor: { type: String, required: true },
    finca: { type: String, required: true },
    animalId: { type: String, required: true }, // Número de chapeta o nombre de la vaca receptora
    tipoProcedimiento: { 
        type: String, 
        required: true,
        enum: ['IA', 'IATF', 'TE'] // Inseminación Artificial, Tiempo Fijo, Transferencia de Embriones
    },
    geneticaUtilizada: { type: String, required: true }, // Nombre del toro, raza o código de la pajilla/embrión
    fechaProcedimiento: { type: Date, default: Date.now },
    fechaPalpacion: { type: Date }, // Fecha sugerida para confirmar preñez (aprox 45-60 días después)
    estadoPrenez: {
        type: String,
        enum: ['Pendiente', 'Preñada', 'Vacía', 'Aborto'],
        default: 'Pendiente'
    },
    veterinarioAsignado: { type: String, required: true }, // Nombre de quien hizo el procedimiento
    observaciones: { type: String }
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = model('RegistroGenetico', RegistroGeneticoSchema);