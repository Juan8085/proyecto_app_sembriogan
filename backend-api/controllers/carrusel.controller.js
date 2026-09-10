const Carrusel = require('../models/carrusel.model');

// Obtener todas las imágenes activas para la web pública
const obtenerCarrusel = async (req, res) => {
    try {
        const imagenes = await Carrusel.find({ activa: true });
        res.status(200).json({ success: true, data: imagenes });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener imágenes", error: error.message });
    }
};

// Subir una nueva imagen desde el panel administrativo
const subirImagenCarrusel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, mensaje: "Falta adjuntar la imagen" });
        }

        const imagenUrl = `/uploads/${req.file.filename}`;
        const nuevaImagen = new Carrusel({ imagen: imagenUrl });
        const guardada = await nuevaImagen.save();

        res.status(201).json({ success: true, mensaje: "Imagen agregada al carrusel", data: guardada });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al guardar la imagen", error: error.message });
    }
};

// Eliminar una imagen del carrusel (Para el botón de borrar en el panel)
const eliminarImagen = async (req, res) => {
    try {
        const { id } = req.params;
        await Carrusel.findByIdAndDelete(id);
        res.status(200).json({ success: true, mensaje: "Imagen eliminada del carrusel" });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al eliminar", error: error.message });
    }
};

module.exports = { obtenerCarrusel, subirImagenCarrusel, eliminarImagen };