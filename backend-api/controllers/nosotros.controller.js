const Nosotros = require('../models/nosotros.model');
const fs = require('fs');
const path = require('path');

const obtenerNosotros = async (req, res) => {
    try {
        const info = await Nosotros.findOne();
        res.status(200).json({ success: true, data: info });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const actualizarNosotros = async (req, res) => {
    try {
        const { titulo, descripcion } = req.body;
        let info = await Nosotros.findOne();
        
        let imagenUrl = info ? info.imagenUrl : null;
        
        // Si el usuario sube una nueva imagen, borramos la vieja del disco
        if (req.file) {
            imagenUrl = `/uploads/${req.file.filename}`;
            if (info && info.imagenUrl) {
                const rutaArchivo = path.join(__dirname, '..', info.imagenUrl);
                if (fs.existsSync(rutaArchivo)) fs.unlinkSync(rutaArchivo);
            }
        }

        if (!imagenUrl) {
            return res.status(400).json({ success: false, mensaje: "Debes subir una imagen inicial." });
        }

        // Crear o actualizar
        if (!info) {
            info = new Nosotros({ titulo, descripcion, imagenUrl });
        } else {
            info.titulo = titulo || info.titulo;
            info.descripcion = descripcion || info.descripcion;
            info.imagenUrl = imagenUrl;
        }

        await info.save();
        res.status(200).json({ success: true, data: info, mensaje: 'Sección actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { obtenerNosotros, actualizarNosotros };