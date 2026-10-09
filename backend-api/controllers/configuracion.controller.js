const Configuracion = require('../models/configuracion.model');

const obtenerConfiguracion = async (req, res) => {
    try {
        let config = await Configuracion.findOne();
        if (!config) {
            config = new Configuracion();
            await config.save();
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const actualizarConfiguracion = async (req, res) => {
    try {
        let config = await Configuracion.findOne();
        if (!config) {
            config = new Configuracion(req.body);
        } else {
            Object.assign(config, req.body);
        }
        await config.save();
        res.status(200).json({ success: true, data: config, mensaje: "Configuración actualizada" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion
};
