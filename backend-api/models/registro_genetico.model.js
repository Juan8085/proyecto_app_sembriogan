const { Schema, model } = require('mongoose');

const RegistroGeneticoSchema = new Schema({
    productor: { type: String, required: true },
    arete: { type: String, required: true },
    tipoProcedimiento: { type: String, enum: ['IATF', 'TE', 'Diagnostico'], required: true },
    geneticaUtilizada: { type: String, required: true }, // Toro o Pajilla
    estadoPrenez: { type: String, enum: ['Preñada', 'Vacía', 'Pendiente Evaluación'], default: 'Pendiente Evaluación' },
    observaciones: { type: String },
    veterinarioAsignado: { type: String }, // Guarda el nombre del Vet que hizo el registro
    
    // Cronograma exacto del Protocolo
    fechasProtocolo: {
        dia0_sincronizacion: { type: Date, required: true },
        dia8_retiro: { type: Date },
        dia10_inseminacion: { type: Date }, // Solo aplica para IATF
        dia17_transferencia: { type: Date }, // Solo aplica para TE
        dia45_confirmacion: { type: Date },
        dia90_entrega: { type: Date } // Solo aplica para TE
    }
}, { timestamps: true });

// Middleware para calcular automáticamente las fechas futuras antes de guardar en MongoDB
RegistroGeneticoSchema.pre('save', function() {
    // Verificamos que existan las fechas para evitar errores con registros muy antiguos
    if (this.fechasProtocolo && this.fechasProtocolo.dia0_sincronizacion) {
        const dia0 = new Date(this.fechasProtocolo.dia0_sincronizacion);
        
        const sumarDias = (fecha, dias) => {
            const nuevaFecha = new Date(fecha);
            nuevaFecha.setDate(nuevaFecha.getDate() + dias);
            return nuevaFecha;
        };

        // Reglas compartidas para ambos protocolos
        this.fechasProtocolo.dia8_retiro = sumarDias(dia0, 8);
        this.fechasProtocolo.dia45_confirmacion = sumarDias(dia0, 45);

        // Reglas específicas según el procedimiento
        if (this.tipoProcedimiento === 'IATF') {
            this.fechasProtocolo.dia10_inseminacion = sumarDias(dia0, 10);
            this.fechasProtocolo.dia17_transferencia = null;
            this.fechasProtocolo.dia90_entrega = null;
        } else if (this.tipoProcedimiento === 'TE') {
            this.fechasProtocolo.dia10_inseminacion = null;
            this.fechasProtocolo.dia17_transferencia = sumarDias(dia0, 17);
            this.fechasProtocolo.dia90_entrega = sumarDias(dia0, 90);
        }
    }
});

module.exports = model('RegistroGenetico', RegistroGeneticoSchema);