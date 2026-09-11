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

        // ⚡ Notificar a todos los paneles conectados en tiempo real
        req.io.emit('actualizar-solicitudes');

        res.status(201).json({
            success: true,
            mensaje: "Solicitud registrada en la base de datos exitosamente",
            data: solicitudGuardada
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al registrar la solicitud", error: error.message });
    }
};

// Actualizar el estado de una solicitud
const actualizarEstadoSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validar que el estado sea uno de los permitidos
        const estadosValidos = ['Pendiente', 'En Proceso', 'Completada', 'Cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ success: false, mensaje: "Estado no válido" });
        }

        const solicitudActualizada = await Solicitud.findByIdAndUpdate(
            id,
            { estado: estado },
            { new: true } // Devuelve el documento actualizado
        );

        if (!solicitudActualizada) {
            return res.status(404).json({ success: false, mensaje: "Solicitud no encontrada" });
        }

        // ⚡ Notificar cambios de estado en tiempo real
        req.io.emit('actualizar-solicitudes');

        res.status(200).json({
            success: true,
            mensaje: "Estado actualizado exitosamente",
            data: solicitudActualizada
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al actualizar la solicitud", error: error.message });
    }
};

module.exports = {
    obtenerSolicitudes,
    crearSolicitud,
    actualizarEstadoSolicitud // <- Añade esto
};