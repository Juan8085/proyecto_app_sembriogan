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

const crypto = require('crypto');

const generarFirmaWompi = async (req, res) => {
    try {
        const { reference, amountInCents, currency } = req.body;
        if (!reference || !amountInCents) return res.status(400).json({ success: false, mensaje: "Faltan datos" });

        const config = await Configuracion.findOne();
        const secret = config?.wompiIntegridadSecret;

        if (!secret) return res.status(500).json({ success: false, mensaje: "Secret de integridad no configurado" });

        const cadena = `${reference}${amountInCents}${currency || 'COP'}${secret}`;
        const signature = crypto.createHash('sha256').update(cadena).digest('hex');

        res.json({ success: true, signature });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion,
    generarFirmaWompi
};
