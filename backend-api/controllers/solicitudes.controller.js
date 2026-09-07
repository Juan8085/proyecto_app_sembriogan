const Solicitud = require('../models/solicitud.model');

// Obtener todas las solicitudes desde MongoDB
const obtenerSolicitudes = async (req, res) => {
    try {
        const solicitudesDB = await Solicitud.find();
        res.status(200).json({
            success: true,
            total: solicitudesDB.length,
            data: solicitudesDB
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener solicitudes", error: error.message });
    }
};

// Crear una nueva solicitud en MongoDB
const crearSolicitud = async (req, res) => {
    try {
        const { productor, finca, servicio } = req.body;

        if (!productor || !finca || !servicio) {
            return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios (productor, finca, servicio)" });
        }

        const nuevaSolicitud = new Solicitud({
            productor,
            finca,
            servicio
        });

        const solicitudGuardada = await nuevaSolicitud.save();

        res.status(201).json({
            success: true,
            mensaje: "Solicitud registrada en la base de datos exitosamente",
            data: solicitudGuardada
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al registrar la solicitud", error: error.message });
    }
};

module.exports = {
    obtenerSolicitudes,
    crearSolicitud
};