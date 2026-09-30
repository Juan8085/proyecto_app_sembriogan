const Suscripcion = require('../models/suscripcion.model');
const webpush = require('web-push');

// Configuramos web-push con las llaves de tu archivo .env
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// 1. Enviar la llave pública al frontend (para no quemarla en el código HTML)
const obtenerClavePublica = (req, res) => {
    res.status(200).json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

// 2. Guardar la suscripción del celular/navegador del veterinario
const suscribir = async (req, res) => {
    try {
        const suscripcion = req.body;
        // Asumiendo que tu token decodificado guarda el ID del usuario en req.usuario.id
        const veterinarioId = req.usuario.id; 

        // Guardamos o actualizamos la suscripción en la base de datos
        await Suscripcion.findOneAndUpdate(
            { veterinarioId, endpoint: suscripcion.endpoint },
            { veterinarioId, ...suscripcion },
            { upsert: true, new: true }
        );

        res.status(201).json({ success: true, mensaje: 'Suscripción guardada en el servidor' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- NUEVA FUNCIÓN PARA PROBAR ---
const probarNotificacion = async (req, res) => {
    try {
        const veterinarioId = req.usuario.id;
        // Buscamos el celular de este veterinario en la BD
        const suscripciones = await Suscripcion.find({ veterinarioId });

        if (suscripciones.length === 0) {
            return res.status(404).json({ success: false, mensaje: "No hay celulares registrados para este usuario." });
        }

        const payload = JSON.stringify({
            title: '🐮 ¡Prueba Sembriogan Exitosa!',
            body: 'El sistema de notificaciones Push en tiempo real está funcionando perfectamente en el dispositivo.',
            url: '/app-veterinario/dashboard.html'
        });

        // Disparamos la notificación a todos los dispositivos de este veterinario
        for (let sub of suscripciones) {
            await webpush.sendNotification(sub, payload);
        }

        res.status(200).json({ success: true, mensaje: "Alerta disparada." });
    } catch (error) {
        console.error("Error enviando push de prueba:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// No olvides actualizar tu exportación para incluirla:
module.exports = { obtenerClavePublica, suscribir, probarNotificacion };
