const Catalogo = require('../models/catalogo.model');

const obtenerCatalogo = async (req, res) => {
    try {
        const catalogoDB = await Catalogo.find();
        res.status(200).json({ success: true, total: catalogoDB.length, data: catalogoDB });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener el catálogo", error: error.message });
    }
};

const crearCatalogoItem = async (req, res) => {
    try {
        const { tipo, descripcion, costo } = req.body;
        const imagen = req.file ? `/uploads/${req.file.filename}` : '';

        if (!tipo || !descripcion || !costo) {
            return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios" });
        }

        const nuevoItem = new Catalogo({ tipo, descripcion, costo, imagen });
        const itemGuardado = await nuevoItem.save();

        res.status(201).json({
            success: true,
            mensaje: "Item agregado al catálogo con éxito",
            data: itemGuardado
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al guardar", error: error.message });
    }
};

module.exports = { obtenerCatalogo, crearCatalogoItem };