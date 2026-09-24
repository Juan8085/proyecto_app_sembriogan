const Orden = require('../models/orden.model');
const Catalogo = require('../models/catalogo.model');

// 1. Crear nueva orden y descontar inventario si son productos físicos
const crearOrden = async (req, res) => {
    try {
        const { cliente, items, total, referenciaWompi } = req.body;

        if (!cliente || !items || items.length === 0 || total === undefined) {
            return res.status(400).json({ success: false, mensaje: "Faltan datos de la orden" });
        }

        // Validar y descontar stock de los productos físicos comprados
        for (let item of items) {
            if (item.catalogoItem) {
                const productoDB = await Catalogo.findById(item.catalogoItem);
                if (productoDB && !productoDB.esServicio) {
                    if (productoDB.stock < item.cantidad) {
                        return res.status(400).json({ 
                            success: false, 
                            mensaje: `Stock insuficiente para el producto: ${productoDB.tipo}. Disponibles: ${productoDB.stock}` 
                        });
                    }
                    productoDB.stock -= item.cantidad;
                    await productoDB.save();
                }
            }
        }

        const nuevaOrden = new Orden({
            cliente,
            items,
            total,
            referenciaWompi,
            estado: 'Aprobado'
        });

        const ordenGuardada = await nuevaOrden.save();

        res.status(201).json({
            success: true,
            mensaje: "Orden registrada y stock actualizado con éxito",
            data: ordenGuardada
        });
    } catch (error) {
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