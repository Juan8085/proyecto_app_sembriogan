const Testimonio = require('../models/testimonio.model');

// Obtener solo los testimonios aprobados para la página pública
const obtenerTestimoniosPublicos = async (req, res) => {
    try {
        const testimonios = await Testimonio.find({ aprobado: true }).sort({ _id: -1 });
        res.status(200).json({ success: true, data: testimonios });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener todos los testimonios (Para el panel de administración)
const obtenerTodosTestimoniosAdmin = async (req, res) => {
    try {
        const testimonios = await Testimonio.find().sort({ _id: -1 });
        res.status(200).json({ success: true, data: testimonios });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un testimonio (Enviado por el cliente)
const crearTestimonio = async (req, res) => {
    try {
        const { nombre, rol, mensaje } = req.body;
        if (!nombre || !mensaje) {
            return res.status(400).json({ success: false, mensaje: "Nombre y mensaje son obligatorios" });
        }

        const nuevoTestimonio = new Testimonio({
            nombre,
            rol: rol || 'Productor Asociado',
            mensaje,
            aprobado: false // Nace pendiente de revisión del administrador
        });

        await nuevoTestimonio.save();
        res.status(201).json({ 
            success: true, 
            mensaje: "¡Testimonio enviado con éxito! Quedará visible en la web tras la aprobación del administrador." 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Aprobar o rechazar un testimonio (Admin)
const cambiarEstadoTestimonio = async (req, res) => {
    try {
        const { id } = req.params;
        const { aprobado } = req.body;

        const testimonioActualizado = await Testimonio.findByIdAndUpdate(
            id, 
            { aprobado }, 
            { new: true }
        );

        if (!testimonioActualizado) {
            return res.status(404).json({ success: false, mensaje: "Testimonio no encontrado" });
        }

        res.status(200).json({ 
            success: true, 
            mensaje: "Estado del testimonio actualizado", 
            data: testimonioActualizado 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar testimonio
const eliminarTestimonio = async (req, res) => {
    try {
        const { id } = req.params;
        await Testimonio.findByIdAndDelete(id);
        res.status(200).json({ success: true, mensaje: "Testimonio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerTestimoniosPublicos,
    obtenerTodosTestimoniosAdmin,
    crearTestimonio,
    cambiarEstadoTestimonio,
    eliminarTestimonio
};