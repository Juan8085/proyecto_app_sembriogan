const RegistroGenetico = require('../models/registro_genetico.model');

// Obtener todo el historial (Para el Admin)
const obtenerRegistros = async (req, res) => {
    try {
        // Ordenamos por la fecha de creación para ver los más recientes primero
        const registros = await RegistroGenetico.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: registros });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo registro en campo (Para la App del Veterinario)
const crearRegistro = async (req, res) => {
    try {
        // req.body ya trae la estructura exacta desde la PWA (arete, productor, fechasProtocolo...)
        const nuevoRegistro = new RegistroGenetico(req.body);
        
        // Asignar el veterinario que viene del token de sesión (si tu middleware JWT lo inyecta)
        if (req.usuario && req.usuario.nombre) {
            nuevoRegistro.veterinarioAsignado = req.usuario.nombre;
        }

        // NOTA: No necesitamos sumar los 45 días aquí manualmente. 
        // El middleware pre('save') que pusimos en registro_genetico.model.js 
        // se encarga de calcular exactamente los días 8, 10, 17, 45 y 90.

        await nuevoRegistro.save();

        // Notificar al admin en tiempo real
        if(req.io) {
            req.io.emit('nuevo-registro-genetico');
        }

        res.status(201).json({ success: true, mensaje: "Registro genético guardado con éxito", data: nuevoRegistro });
    } catch (error) {
        console.error("Error en el backend al crear registro:", error);
        res.status(500).json({ success: false, error: error.message, mensaje: "Error del servidor al guardar el registro." });
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