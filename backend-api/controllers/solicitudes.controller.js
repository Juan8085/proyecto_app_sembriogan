// Simulación de base de datos en memoria para solicitudes
let solicitudesDB = [
    { id: 1, productor: "Carlos Pérez", finca: "La Esmeralda", servicio: "Inseminación Artificial", estado: "Pendiente", fecha: "2026-09-03" },
    { id: 2, productor: "María Gómez", finca: "El Oasis", servicio: "Aspiración Folicular (OPU)", estado: "En Proceso", fecha: "2026-09-02" }
];

// Obtener todas las solicitudes
const obtenerSolicitudes = (req, res) => {
    try {
        res.status(200).json({
            success: true,
            total: solicitudesDB.length,
            data: solicitudesDB
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener solicitudes", error: error.message });
    }
};

// Crear una nueva solicitud
const crearSolicitud = (req, res) => {
    try {
        const { productor, finca, servicio } = req.body;

        if (!productor || !finca || !servicio) {
            return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios (productor, finca, servicio)" });
        }

        const nuevaSolicitud = {
            id: solicitudesDB.length + 1,
            productor,
            finca,
            servicio,
            estado: "Pendiente",
            fecha: new Date().toISOString().split('T')[0]
        };

        solicitudesDB.push(nuevaSolicitud);

        res.status(201).json({
            success: true,
            mensaje: "Solicitud registrada exitosamente",
            data: nuevaSolicitud
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al registrar la solicitud", error: error.message });
    }
};

module.exports = {
    obtenerSolicitudes,
    crearSolicitud
};