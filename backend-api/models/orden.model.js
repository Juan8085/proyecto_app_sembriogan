const { Schema, model } = require('mongoose');

const OrdenSchema = new Schema({
    cliente: {
        nombre: { type: String, required: true },
        email: { type: String, required: true }
    },
    items: [{
        catalogoItem: { type: Schema.Types.ObjectId, ref: 'Catalogo' },
        tipo: { type: String, required: true },
        costo: { type: Number, required: true },
        cantidad: { type: Number, required: true, default: 1 }
    }],
    total: { type: Number, required: true },
    referenciaWompi: { type: String, unique: true, sparse: true },
    estado: { type: String, enum: ['Aprobado', 'Pendiente', 'Rechazado'], default: 'Aprobado' }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = model('Orden', OrdenSchema);