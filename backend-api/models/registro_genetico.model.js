const { Schema, model } = require('mongoose');

const RegistroGeneticoSchema = new Schema({
    productor: { type: String, required: true },
    productorEmail: { type: String, required: false }, // Para enlazar con la cuenta del cliente
    telefonoProductor: { type: String, default: '' },
    municipio: { type: String, default: 'Neiva, Huila' },
    finca: { type: String, required: false },
    arete: { type: String, required: true },
    raza: { type: String, required: false },
    tipoProcedimiento: { 
        type: String, 
        enum: ['IATF', 'TE', 'Diagnostico', 'IA', 'Atencion de Parto'], 
        required: true 
    },
    tipoProduccion: { 
        type: String, 
        enum: ['Doble Propósito', 'Leche', 'Carne', 'Genética/Biotecnología', 'Cría y Levante', 'Otro'],
        default: 'Doble Propósito' 
    },
    geneticaUtilizada: { type: String, default: 'Pendiente de Selección' }, // Toro o Pajilla (puede quedar pendiente hasta el día de inseminación/transferencia)
    estadoPrenez: { type: String, enum: ['Preñada', 'Vacía', 'Pendiente Evaluación', 'Parto Atendido'], default: 'Pendiente Evaluación' },
    observaciones: { type: String },
    veterinarioAsignado: { type: String, default: 'Equipo Veterinario Sembriogan' }, // Guarda el nombre del Vet asignado
    origenRegistro: { type: String, enum: ['Oficina / Administrativo', 'Campo / App Móvil'], default: 'Oficina / Administrativo' },
    
    // Cronograma exacto del Protocolo
    fechasProtocolo: {
        dia0_sincronizacion: { type: Date, required: true },
        dia8_retiro: { type: Date },
        dia10_inseminacion: { type: Date }, // Solo aplica para IATF
        dia17_transferencia: { type: Date }, // Solo aplica para TE
        dia45_confirmacion: { type: Date },
        dia90_entrega: { type: Date } // Solo aplica para TE
    },
    // Seguimiento de pasos realizados por el veterinario
    pasosCompletados: {
        dia8_retiro: { type: Boolean, default: false },
        dia10_inseminacion: { type: Boolean, default: false },
        dia17_transferencia: { type: Boolean, default: false },
        dia45_confirmacion: { type: Boolean, default: false }
    },
    coordenadas: {
        lat: { type: Number },
        lng: { type: Number }
    }
}, { timestamps: true });

// Middleware para calcular automáticamente las fechas futuras antes de guardar en MongoDB
RegistroGeneticoSchema.pre('save', function() {
    // Si no se asignó genética, asegurar valor por defecto
    if (!this.geneticaUtilizada || !this.geneticaUtilizada.trim()) {
        this.geneticaUtilizada = 'Pendiente de Selección';
    }

    // Verificamos que existan las fechas para evitar errores con registros muy antiguos
    if (this.fechasProtocolo && this.fechasProtocolo.dia0_sincronizacion) {
        const dia0 = new Date(this.fechasProtocolo.dia0_sincronizacion);
        
        const sumarDias = (fecha, dias) => {
            const nuevaFecha = new Date(fecha);
            nuevaFecha.setDate(nuevaFecha.getDate() + dias);
            return nuevaFecha;
        };

        // Reglas específicas según el procedimiento
        if (this.tipoProcedimiento === 'IA') {
            // IA: Inseminación en celo natural. NO requiere protocolo hormonal ni retiro de dispositivo ni día 10.
            // Únicamente se evalúa confirmación de preñez a los 45 días post-inseminación.
            this.fechasProtocolo.dia8_retiro = null;
            this.fechasProtocolo.dia10_inseminacion = null;
            this.fechasProtocolo.dia17_transferencia = null;
            this.fechasProtocolo.dia45_confirmacion = sumarDias(dia0, 45);
            this.fechasProtocolo.dia90_entrega = null;
        } else if (this.tipoProcedimiento === 'IATF') {
            // IATF: Protocolo hormonal a tiempo fijo
            this.fechasProtocolo.dia8_retiro = sumarDias(dia0, 8);
            this.fechasProtocolo.dia10_inseminacion = sumarDias(dia0, 10);
            this.fechasProtocolo.dia17_transferencia = null;
            this.fechasProtocolo.dia45_confirmacion = sumarDias(dia0, 45);
            this.fechasProtocolo.dia90_entrega = null;
        } else if (this.tipoProcedimiento === 'TE') {
            // TE: Transferencia de Embriones
            this.fechasProtocolo.dia8_retiro = sumarDias(dia0, 8);
            this.fechasProtocolo.dia10_inseminacion = null;
            this.fechasProtocolo.dia17_transferencia = sumarDias(dia0, 17);
            this.fechasProtocolo.dia45_confirmacion = sumarDias(dia0, 45);
            this.fechasProtocolo.dia90_entrega = sumarDias(dia0, 90);
        } else if (this.tipoProcedimiento === 'Diagnostico') {
            this.fechasProtocolo.dia8_retiro = null;
            this.fechasProtocolo.dia10_inseminacion = null;
            this.fechasProtocolo.dia17_transferencia = null;
            this.fechasProtocolo.dia45_confirmacion = dia0;
            this.fechasProtocolo.dia90_entrega = null;
        } else if (this.tipoProcedimiento === 'Atencion de Parto') {
            this.fechasProtocolo.dia8_retiro = null;
            this.fechasProtocolo.dia10_inseminacion = null;
            this.fechasProtocolo.dia17_transferencia = null;
            this.fechasProtocolo.dia45_confirmacion = dia0;
            this.fechasProtocolo.dia90_entrega = null;
        }
    }
});

module.exports = model('RegistroGenetico', RegistroGeneticoSchema);