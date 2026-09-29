const Orden = require('../models/orden.model');
const Catalogo = require('../models/catalogo.model');

// 1. Crear una orden y descontar inventario
const crearOrden = async (req, res) => {
    try {
        const { cliente, comprador, items, total, referenciaWompi, estadoPago } = req.body;

        const nuevaOrden = new Orden({
            cliente, 
            comprador,
            items,
            total,
            referenciaWompi,
            estadoPago: estadoPago || 'Pendiente',
            fecha: new Date()
        });
        
        await nuevaOrden.save();

        if (estadoPago === 'Aprobado') {
            for (let item of items) {
                await Catalogo.findByIdAndUpdate(item.id, {
                    $inc: { stock: -item.cantidad }
                });
            }
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
        // CORRECCIÓN FINAL: Buscamos por el campo real que muestra MongoDB: 'estado'
        const ordenes = await Orden.find({ estado: 'Aprobado' });

        const ingresosTotales = ordenes.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        const mesesMap = {};
        const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        ordenes.forEach(orden => {
            const fecha = new Date(orden.createdAt || orden.fecha || Date.now());
            const mesStr = nombresMeses[fecha.getMonth()];
            
            if (!mesesMap[mesStr]) {
                mesesMap[mesStr] = { ingresos: 0, procedimientos: 0 };
            }
            
            mesesMap[mesStr].ingresos += (Number(orden.total) || 0);
            
            const totalItems = orden.items ? orden.items.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0) : 0;
            mesesMap[mesStr].procedimientos += totalItems;
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