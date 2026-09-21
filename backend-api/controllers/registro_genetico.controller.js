const RegistroGenetico = require('../models/registro_genetico.model');

// Obtener todo el historial (Para el Admin)
const obtenerRegistros = async (req, res) => {
    try {
        const registros = await RegistroGenetico.find().sort({ fechaProcedimiento: -1 });
        res.status(200).json({ success: true, data: registros });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo registro en campo (Para la App del Veterinario)
const crearRegistro = async (req, res) => {
    try {
        const nuevoRegistro = new RegistroGenetico(req.body);
        
        // Calcular fecha estimada de palpación (Ej: 45 días después del procedimiento)
        const fechaPalpacion = new Date(nuevoRegistro.fechaProcedimiento);
        fechaPalpacion.setDate(fechaPalpacion.getDate() + 45);
        nuevoRegistro.fechaPalpacion = fechaPalpacion;

        await nuevoRegistro.save();

        // Notificar al admin en tiempo real
        if(req.io) {
            req.io.emit('nuevo-registro-genetico');
        }

        res.status(201).json({ success: true, mensaje: "Registro genético guardado con éxito", data: nuevoRegistro });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar resultado de preñez (Cuando el Vet vuelve a palpar)
const actualizarPrenez = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoPrenez, observaciones } = req.body;
        
        const actualizado = await RegistroGenetico.findByIdAndUpdate(
            id, 
            { estadoPrenez, observaciones }, 
            { new: true }
        );

        if(req.io) req.io.emit('nuevo-registro-genetico');

        res.status(200).json({ success: true, mensaje: "Diagnóstico actualizado", data: actualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { obtenerRegistros, crearRegistro, actualizarPrenez };