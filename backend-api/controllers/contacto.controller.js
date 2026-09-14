const Contacto = require('../models/contacto.model');

const obtenerContactos = async (req, res) => {
    try {
        const contactos = await Contacto.find();
        res.status(200).json({ success: true, data: contactos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const crearContacto = async (req, res) => {
    try {
        const { sucursal, direccion, telefono, email, whatsapp } = req.body;
        const nuevoContacto = new Contacto({ sucursal, direccion, telefono, email, whatsapp });
        await nuevoContacto.save();
        req.io.emit('actualizar-contacto');
        res.status(201).json({ success: true, mensaje: "Sucursal agregada con éxito" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const eliminarContacto = async (req, res) => {
    try {
        await Contacto.findByIdAndDelete(req.params.id);
        req.io.emit('actualizar-contacto');
        res.status(200).json({ success: true, mensaje: "Sucursal eliminada" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { obtenerContactos, crearContacto, eliminarContacto };