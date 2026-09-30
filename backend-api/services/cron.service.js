const cron = require('node-cron');
const webpush = require('web-push');
const RegistroGenetico = require('../models/registro_genetico.model');
const Suscripcion = require('../models/suscripcion.model');

const iniciarCron = () => {
    // 0 6 * * * significa: Todos los días a las 6:00 AM exactas
    cron.schedule('0 6 * * *', async () => {
        console.log('⏰ Ejecutando revisión diaria de procedimientos a las 6:00 AM...');
        
        try {
            // Calculamos la fecha exacta de hace 45 días
            const fechaHace45Dias = new Date();
            fechaHace45Dias.setDate(fechaHace45Dias.getDate() - 45);
            
            // Establecemos las 00:00:00 y las 23:59:59 de ese día para abarcarlo completo
            const inicioDia = new Date(fechaHace45Dias.setHours(0,0,0,0));
            const finDia = new Date(fechaHace45Dias.setHours(23,59,59,999));

            // Buscamos todas las vacas inseminadas hace 45 días que sigan "Pendientes"
            const registros = await RegistroGenetico.find({
                estadoPrenez: { $in: ['Pendiente Evaluación', 'Pendiente'] },
                createdAt: { $gte: inicioDia,$lte: finDia }
            });

            if(registros.length === 0) {
                console.log('No hay chequeos de preñez programados para hoy.');
                return;
            }

            console.log(`Se encontraron ${registros.length} procedimientos listos para chequeo hoy.`);

            // Por cada vaca lista, le avisamos a su respectivo veterinario
            for (let registro of registros) {
                // Buscamos el celular del veterinario que hizo el registro
                const suscripciones = await Suscripcion.find({ veterinarioId: registro.veterinarioId });
                
                const payload = JSON.stringify({
                    title: '📅 Diagnóstico de Preñez',
                    body: `La vaca ${registro.arete || 'Sin chapeta'} en la finca ${registro.finca || 'del cliente'} cumple hoy 45 días desde su IATF.`,
                    icon: '/img/logo.png', // Logo de tu app
                    url: '/app-veterinario/dashboard.html'
                });

                // Disparamos la notificación
                for (let sub of suscripciones) {
                    try {
                        await webpush.sendNotification(sub, payload);
                    } catch (error) {
                        // Si el celular apagó las notificaciones o cambió, borramos la suscripción obsoleta
                        if (error.statusCode === 410) {
                            await Suscripcion.findByIdAndDelete(sub._id);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error en el cron job:', error);
        }
    });
};

module.exports = { iniciarCron };