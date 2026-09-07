// backend-api/controllers/catalogo.controller.js
const Catalogo = require('../models/catalogo.model');

// Obtener todo el catálogo desde MongoDB
const obtenerCatalogo = async (req, res) => {
    try {
        const catalogoDB = await Catalogo.find();
        res.status(200).json({
            success: true,
            total: catalogoDB.length,
            data: catalogoDB
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener el catálogo", error: error.message });
    }
};

// Crear un nuevo servicio en el catálogo (útil para el panel administrativo)
const crearCatalogoItem = async (req, res) => {
    try {
        const { tipo, descripcion, costo } = req.body;

        if (!tipo || !descripcion || !costo) {
            return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios (tipo, descripcion, costo)" });
        }

        const nuevoItem = new Catalogo({
            tipo,
            descripcion,
            costo
        });

        const itemGuardado = await nuevoItem.save();

        res.status(201).json({
            success: true,
            mensaje: "Item agregado al catálogo exitosamente",
            data: itemGuardado
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al guardar en el catálogo", error: error.message });
    }
};

module.exports = {
    obtenerCatalogo,
    crearCatalogoItem
};