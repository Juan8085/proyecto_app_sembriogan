const crypto = require('crypto');
const Catalogo = require('../models/catalogo.model');
const Orden = require('../models/orden.model');
const Configuracion = require('../models/configuracion.model');

// Helper para consultar el estado real de una transacción en la API de Wompi
async function consultarTransaccionWompi(transactionId) {
    if (!transactionId) return null;
    try {
        // Intentar primero en sandbox
        let res = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`);
        let json = await res.json();
        if (json.data && json.data.id) return json.data;

        // Intentar en producción si no existe en sandbox
        res = await fetch(`https://production.wompi.co/v1/transactions/${transactionId}`);
        json = await res.json();
        if (json.data && json.data.id) return json.data;
    } catch (e) {
        console.error('[WOMPI] Error consultando API de Wompi:', e);
    }
    return null;
}

// Lógica unificada para procesar pagos aprobados, registrar orden y descontar stock
async function procesarPagoAprobado({ reference, transactionId, amountInCents, customerEmail, customerName, items, prodId, cantidad, req }) {
    console.log(`[WOMPI] Procesando pago aprobado. Ref: ${reference}, TransId: ${transactionId}`);

    // 1. Evitar duplicados (idempotencia)
    const queryCond = [];
    if (reference) queryCond.push({ referenciaWompi: reference });
    if (transactionId) queryCond.push({ referenciaWompi: transactionId });

    let ordenExistente = null;
    if (queryCond.length > 0) {
        ordenExistente = await Orden.findOne({ $or: queryCond });
    }

    if (ordenExistente && ordenExistente.estado === 'Aprobado') {
        console.log(`[WOMPI] Orden ya registrada y aprobada previamente: ${ordenExistente._id}`);
        return { success: true, orden: ordenExistente, yaProcesada: true };
    }

    // 2. Extraer o deducir los ítems comprados
    let itemsAProcesar = [];

    if (Array.isArray(items) && items.length > 0) {
        itemsAProcesar = items;
    } else if (prodId) {
        const prod = await Catalogo.findById(prodId);
        if (prod) {
            itemsAProcesar.push({
                catalogoItem: prod._id,
                tipo: prod.tipo,
                costo: prod.costo,
                cantidad: Number(cantidad) || 1
            });
        }
    } else if (reference) {
        // Buscar producto desde la referencia (ej: VET-timestamp-idCorto)
        const partes = reference.split('-');
        const idCorto = partes[partes.length - 1];
        const productos = await Catalogo.find({});
        const prod = productos.find(p => p._id.toString().substring(0, 5) === idCorto || p._id.toString() === idCorto);
        if (prod) {
            itemsAProcesar.push({
                catalogoItem: prod._id,
                tipo: prod.tipo,
                costo: prod.costo,
                cantidad: 1
            });
        }
    }

    // Si aún no hay items pero tenemos monto, buscar si coincide con algún producto
    if (itemsAProcesar.length === 0 && amountInCents) {
        const montoPesos = amountInCents / 100;
        const prodPorPrecio = await Catalogo.findOne({ costo: montoPesos });
        if (prodPorPrecio) {
            itemsAProcesar.push({
                catalogoItem: prodPorPrecio._id,
                tipo: prodPorPrecio.tipo,
                costo: prodPorPrecio.costo,
                cantidad: 1
            });
        }
    }

    // 3. Descontar stock real en el catálogo para productos físicos (no servicios)
    for (let it of itemsAProcesar) {
        const itemId = it.catalogoItem || it.id || it.productoId || it._id;
        const cant = Number(it.cantidad) || 1;
        if (itemId) {
            const prod = await Catalogo.findById(itemId);
            if (prod) {
                if (!prod.esServicio) {
                    const stockAnterior = prod.stock || 0;
                    prod.stock = Math.max(0, stockAnterior - cant);
                    await prod.save();
                    console.log(`[WOMPI] Stock reducido para "${prod.tipo}". Antes: ${stockAnterior}, Ahora: ${prod.stock}`);
                }
            }
        }
    }

    // 4. Crear o actualizar la Orden cumpliendo el esquema Mongoose
    const totalPesos = amountInCents 
        ? (amountInCents / 100) 
        : (itemsAProcesar.reduce((acc, it) => acc + (it.costo * (Number(it.cantidad) || 1)), 0) || 0);

    const nombreFinal = customerName || (customerEmail ? customerEmail.split('@')[0] : 'Cliente Sembriogan');
    const emailFinal = customerEmail || 'comprador@sembriogan.com';

    let ordenFinal;
    if (ordenExistente) {
        ordenExistente.estado = 'Aprobado';
        if (transactionId) ordenExistente.referenciaWompi = transactionId;
        if (itemsAProcesar.length > 0 && (!ordenExistente.items || ordenExistente.items.length === 0)) {
            ordenExistente.items = itemsAProcesar.map(it => ({
                catalogoItem: it.catalogoItem || it.id || it.productoId || it._id,
                tipo: it.tipo || 'Producto',
                costo: it.costo || 0,
                cantidad: Number(it.cantidad) || 1
            }));
        }
        ordenFinal = await ordenExistente.save();
    } else {
        ordenFinal = new Orden({
            cliente: {
                nombre: nombreFinal,
                email: emailFinal
            },
            referenciaWompi: transactionId || reference || `WOMPI-${Date.now()}`,
            total: totalPesos,
            items: itemsAProcesar.map(it => ({
                catalogoItem: it.catalogoItem || it.id || it.productoId || it._id,
                tipo: it.tipo || 'Producto',
                costo: it.costo || 0,
                cantidad: Number(it.cantidad) || 1
            })),
            estado: 'Aprobado'
        });
        await ordenFinal.save();
        console.log(`[WOMPI] Nueva orden registrada en BD: ${ordenFinal._id} - Total: $${totalPesos}`);
    }

    // 5. Emitir eventos en tiempo real si el servidor tiene sockets
    if (req && req.io) {
        req.io.emit('actualizacion-catalogo');
        req.io.emit('nueva-orden');
    }

    return { success: true, orden: ordenFinal };
}

// 1. Webhook Wompi Oficial
const webhookWompi = async (req, res) => {
    try {
        const eventData = req.body;
        if (!eventData || !eventData.data || !eventData.data.transaction) {
            return res.status(400).send('Bad Request: No transaction data');
        }

        const transaccion = eventData.data.transaction;
        const reference = transaccion.reference;
        const status = transaccion.status;

        console.log(`[WEBHOOK WOMPI] Recibido: Ref ${reference} - TransId ${transaccion.id} - Estado: ${status}`);

        if (status === 'APPROVED') {
            await procesarPagoAprobado({
                reference,
                transactionId: transaccion.id,
                amountInCents: transaccion.amount_in_cents,
                customerEmail: transaccion.customer_email,
                customerName: transaccion.customer_data?.full_name,
                req
            });
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[WEBHOOK WOMPI] Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

// 2. Endpoint para verificar transacción con la API de Wompi (usado desde la web o checkout callback)
const verificarTransaccion = async (req, res) => {
    try {
        const { transactionId, reference, items, cliente, total, prodId, cantidad } = req.body;
        console.log('[VERIFICAR WOMPI] Petición recibida:', { transactionId, reference });

        let transaccionWompi = null;
        if (transactionId) {
            transaccionWompi = await consultarTransaccionWompi(transactionId);
        }

        const status = transaccionWompi ? transaccionWompi.status : 'APPROVED';

        if (status === 'APPROVED') {
            const resultado = await procesarPagoAprobado({
                reference: reference || transaccionWompi?.reference,
                transactionId: transactionId || transaccionWompi?.id,
                amountInCents: transaccionWompi ? transaccionWompi.amount_in_cents : (total ? total * 100 : null),
                customerEmail: cliente?.email || transaccionWompi?.customer_email,
                customerName: cliente?.nombre || transaccionWompi?.customer_data?.full_name,
                items,
                prodId,
                cantidad,
                req
            });

            return res.status(200).json({
                success: true,
                mensaje: "Pago verificado exitosamente y stock descontado.",
                data: resultado.orden
            });
        } else {
            return res.status(400).json({
                success: false,
                status,
                mensaje: `La transacción tiene estado: ${status}`
            });
        }
    } catch (error) {
        console.error('[VERIFICAR WOMPI] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Endpoint de redirección tras completar pago en Wompi (para el celular o web)
const confirmarWompiRedirect = async (req, res) => {
    try {
        const { id, ref, prodId, cantidad } = req.query;
        console.log('[REDIRECT WOMPI] Navegador retornó de Wompi:', { id, ref, prodId });

        let status = 'APPROVED';
        let transaccionWompi = null;

        if (id) {
            transaccionWompi = await consultarTransaccionWompi(id);
            if (transaccionWompi) {
                status = transaccionWompi.status;
            }
        }

        if (status === 'APPROVED') {
            await procesarPagoAprobado({
                reference: ref || transaccionWompi?.reference,
                transactionId: id || transaccionWompi?.id,
                amountInCents: transaccionWompi?.amount_in_cents,
                customerEmail: transaccionWompi?.customer_email,
                customerName: transaccionWompi?.customer_data?.full_name,
                prodId,
                cantidad,
                req
            });

            return res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Pago Exitoso - Sembriogan</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                        .card { background: white; padding: 40px 30px; border-radius: 28px; box-shadow: 0 15px 35px rgba(0,0,0,0.06); text-align: center; max-width: 440px; width: 100%; border: 1px solid #e2e8f0; }
                        .icon { width: 72px; height: 72px; background: #ecfdf5; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 38px; margin: 0 auto 20px auto; border: 2px solid #a7f3d0; }
                        h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 24px; font-weight: 900; }
                        p { color: #64748b; margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; }
                        .pill { background: #f1f5f9; padding: 8px 16px; border-radius: 12px; font-mono; font-size: 13px; color: #334155; display: inline-block; margin-bottom: 24px; font-weight: 600; }
                        .btn { display: inline-block; background: #0284c7; color: white; padding: 14px 28px; border-radius: 14px; font-weight: bold; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); transition: transform 0.2s; }
                        .btn:active { transform: scale(0.98); }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon">✓</div>
                        <h1>¡Pago Exitoso!</h1>
                        <p>Tu pago con Wompi fue aprobado correctamente. El inventario ha sido actualizado en el sistema.</p>
                        ${id ? `<div class="pill">Transacción: ${id.slice(-10)}</div><br>` : ''}
                        <a href="javascript:window.close()" class="btn">Volver a Sembriogan</a>
                    </div>
                </body>
                </html>
            `);
        } else {
            return res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Estado del Pago - Sembriogan</title>
                    <style>
                        body { font-family: sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
                        .card { background: white; padding: 40px 30px; border-radius: 28px; text-align: center; max-width: 440px; border: 1px solid #e2e8f0; }
                        .icon { font-size: 40px; margin-bottom: 16px; }
                        h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 22px; }
                        p { color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 20px; }
                        .btn { display: inline-block; background: #475569; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon">⚠️</div>
                        <h1>Transacción en Proceso o Rechazada</h1>
                        <p>El estado actual es: <strong>${status}</strong>. Si el monto fue debitado, el sistema actualizará tu orden en unos minutos.</p>
                        <a href="javascript:window.close()" class="btn">Cerrar Ventana</a>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('[REDIRECT WOMPI] Error:', error);
        res.status(500).send('Error procesando confirmación.');
    }
};

module.exports = {
    webhookWompi,
    verificarTransaccion,
    confirmarWompiRedirect
};
