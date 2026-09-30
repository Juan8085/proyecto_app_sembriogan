const Carrusel = require('../models/carrusel.model');
const fs = require('fs');
const path = require('path');

// Obtener todas las imágenes para mostrarlas en la Web Pública
const obtenerCarrusel = async (req, res) => {
    try {
        const imagenes = await Carrusel.find({ activo: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: imagenes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Subir una nueva imagen desde el Panel Admin
const crearCarrusel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, mensaje: "No se proporcionó ninguna imagen" });
        }

        const { titulo, descripcion } = req.body;
        
        // Creamos la URL relativa para que el frontend pueda leerla
        const imagenUrl = `/uploads/${req.file.filename}`;

        const nuevaImagen = new Carrusel({
            titulo: titulo || '',
            descripcion: descripcion || '',
            imagenUrl
        });

        await nuevaImagen.save();
        res.status(201).json({ success: true, mensaje: "Imagen subida al carrusel", data: nuevaImagen });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar una imagen del Panel Admin (Borra el registro y el archivo físico)
const eliminarCarrusel = async (req, res) => {
    try {
        const imagen = await Carrusel.findById(req.params.id);
        if (!imagen) {
            return res.status(404).json({ success: false, mensaje: "Imagen no encontrada" });
        }

        // Borrar el archivo físico del disco duro del servidor
        const rutaArchivo = path.join(__dirname, '..', imagen.imagenUrl);
        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
        }

        // Borrar de la base de datos
        await Carrusel.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, mensaje: "Imagen eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerCarrusel,
    crearCarrusel,
    eliminarCarrusel
};