const Orden = require('../models/orden.model');
const Catalogo = require('../models/catalogo.model');

// Crear una orden y descontar inventario
const crearOrden = async (req, res) => {
    try {
        const { comprador, items, total, referenciaWompi, estadoPago } = req.body;

        // 1. Crear el registro financiero
        const nuevaOrden = new Orden({
            comprador,
            items,
            total,
            referenciaWompi,
            estadoPago: estadoPago || 'Pendiente',
            fecha: new Date()
        });
        await nuevaOrden.save();

        // 2. Descontar el inventario (Stock) si el pago fue aprobado
        if (estadoPago === 'Aprobado') {
            for (let item of items) {
                // $inc con valor negativo resta exactamente la cantidad comprada
                await Catalogo.findByIdAndUpdate(item.id, {
                    $inc: { stock: -item.cantidad }
                });
            }
        }

        // 3. (Opcional) Notificar al Panel Administrativo en tiempo real por WebSockets
        if (req.io) {
            req.io.emit('nueva-venta-realizada');
        }

        res.status(201).json({ success: true, mensaje: "Orden procesada y stock descontado", data: nuevaOrden });
    } catch (error) {
        console.error("Error al procesar la orden:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Obtener todas las órdenes (Para el panel de administración)
const obtenerOrdenes = async (req, res) => {
    try {
        const ordenes = await Orden.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: ordenes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Obtener resumen financiero real y datos agrupados por mes para el Dashboard
const obtenerResumenFinanciero = async (req, res) => {
    try {
        const ordenes = await Orden.find({ estado: 'Aprobado' });

        const ingresosTotales = ordenes.reduce((sum, o) => sum + o.total, 0);

        // Agrupar por mes para alimentar la gráfica
        const mesesMap = {};
        const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        ordenes.forEach(orden => {
            const fecha = new Date(orden.createdAt);
            const mesStr = nombresMeses[fecha.getMonth()];
            
            if (!mesesMap[mesStr]) {
                mesesMap[mesStr] = { ingresos: 0, procedimientos: 0 };
            }
            mesesMap[mesStr].ingresos += orden.total;
            mesesMap[mesStr].procedimientos += orden.items.reduce((acc, item) => acc + item.cantidad, 0);
        });

        const datosGrafica = Object.keys(mesesMap).map(mes => ({
            mes,
            ingresos: mesesMap[mes].ingresos,
            procedimientos: mesesMap[mes].procedimientos
        }));

        res.status(200).json({
            success: true,
            ingresosTotales,
            totalOrdenes: ordenes.length,
            datosGrafica: datosGrafica.length > 0 ? datosGrafica : [
                { mes: 'Actual', ingresos: ingresosTotales, procedimientos: 0 }
            ]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    crearOrden,
    obtenerOrdenes,
    obtenerResumenFinanciero
};