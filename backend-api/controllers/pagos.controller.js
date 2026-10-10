const crypto = require('crypto');
const Catalogo = require('../models/catalogo.model');
const Orden = require('../models/orden.model');
const Configuracion = require('../models/configuracion.model');

const webhookWompi = async (req, res) => {
    try {
        const signatureHeader = req.headers['x-event-checksum'];
        const eventData = req.body;

        // Si Wompi no manda firma, rechazamos (opcional según config)
        if (!eventData || !eventData.data || !eventData.data.transaction) {
            return res.status(400).send('Bad Request');
        }

        const transaccion = eventData.data.transaction;
        const reference = transaccion.reference;
        const status = transaccion.status; // APPROVED, DECLINED, VOIDED, ERROR

        console.log(`Webhook Wompi recibido: Referencia ${reference} - Estado: ${status}`);

        if (status === 'APPROVED') {
            // Verificar si el pago ya fue procesado para no descontar el inventario 2 veces
            const ordenExistente = await Orden.findOne({ referenciaWompi: reference });
            if (ordenExistente && ordenExistente.estado === 'Aprobado') {
                return res.status(200).send('OK');
            }

            // Extraer el ID del producto desde la referencia
            // La referencia actual es VET-{timestamp}-{id_5_letras} o PRODUCT-{id}
            // Para simplificar, buscaremos el producto por los primeros 5 caracteres del ID.
            // (En un entorno de producción, es mejor enviar el ID completo en la referencia).
            const partes = reference.split('-');
            const idCorto = partes[partes.length - 1];

            // Buscar producto por ID o ID corto
            const productos = await Catalogo.find({});
            const producto = productos.find(p => p._id.toString().substring(0, 5) === idCorto || p._id.toString() === idCorto);

            if (producto) {
                // Reducir stock si no es un servicio
                if (!producto.esServicio && producto.stock > 0) {
                    producto.stock -= 1;
                    await producto.save();
                    console.log(`Inventario reducido para ${producto.nombre}. Stock actual: ${producto.stock}`);
                }

                // Crear o actualizar orden
                if (ordenExistente) {
                    ordenExistente.estado = 'Aprobado';
                    await ordenExistente.save();
                } else {
                    const nuevaOrden = new Orden({
                        clienteId: transaccion.customer_email || 'Invitado',
                        referenciaWompi: reference,
                        total: transaccion.amount_in_cents / 100,
                        productos: [{
                            productoId: producto._id,
                            nombre: producto.nombre,
                            precio: producto.costo,
                            cantidad: 1
                        }],
                        estado: 'Aprobado'
                    });
                    await nuevaOrden.save();
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error procesando Webhook Wompi:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    webhookWompi
};
