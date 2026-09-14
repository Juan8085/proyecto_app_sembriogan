const Contacto = require('../models/contacto.model');

const obtenerContacto = async (req, res) => {
    try {
        const contactos = await Contacto.find();
        res.status(200).json({ success: true, data: contactos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const actualizarContacto = async (req, res) => {
    try {
        const { sucursal, direccion, telefono, email, whatsapp } = req.body;
        // Asumimos un solo registro principal por ahora. Si no existe, lo crea.
        let contacto = await Contacto.findOne();
        
        if (!contacto) {
            contacto = new Contacto({ sucursal, direccion, telefono, email, whatsapp });
            await contacto.save();
        } else {
            contacto.sucursal = sucursal;
            contacto.direccion = direccion;
            contacto.telefono = telefono;
            contacto.email = email;
            contacto.whatsapp = whatsapp;
            await contacto.save();
        }

        // Notificar en tiempo real (Sockets) si los clientes están en la web
        req.io.emit('actualizar-contacto');

        res.status(200).json({ success: true, mensaje: "Información de contacto actualizada", data: contacto });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { obtenerContacto, actualizarContacto };