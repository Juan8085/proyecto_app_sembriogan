const Testimonio = require('../models/testimonio.model');

// Obtener todos para el panel administrativo
const obtenerTestimoniosAdmin = async (req, res) => {
    try {
        const testimonios = await Testimonio.find();
        res.status(200).json({ success: true, data: testimonios });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener testimonios", error: error.message });
    }
};

// Obtener solo los aprobados para la página pública
const obtenerTestimoniosPublicos = async (req, res) => {
    try {
        const testimonios = await Testimonio.find({ aprobado: true });
        res.status(200).json({ success: true, data: testimonios });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener testimonios", error: error.message });
    }
};

// Crear testimonio desde la landing page (pendiente de aprobación)
const crearTestimonio = async (req, res) => {
    try {
        const { productor, finca, comentario } = req.body;
        if (!productor || !finca || !comentario) {
            return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios" });
        }
        const nuevo = new Testimonio({ productor, finca, comentario, aprobado: false });
        await nuevo.save();
        res.status(201).json({ success: true, mensaje: "¡Gracias por tu testimonio! Estará visible tras la validación de Sembriogan." });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al enviar testimonio", error: error.message });
    }
};

// Aprobar testimonio desde el panel administrativo
const aprobarTestimonio = async (req, res) => {
    try {
        const { id } = req.params;
        const actualizado = await Testimonio.findByIdAndUpdate(id, { aprobado: true }, { new: true });
        res.status(200).json({ success: true, mensaje: "Testimonio aprobado y publicado", data: actualizado });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al aprobar", error: error.message });
    }
};

const eliminarTestimonio = async (req, res) => {
    try {
        await Testimonio.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, mensaje: "Testimonio eliminado" });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al eliminar", error: error.message });
    }
};

module.exports = { obtenerTestimoniosAdmin, obtenerTestimoniosPublicos, crearTestimonio, aprobarTestimonio, eliminarTestimonio };