const Catalogo = require('../models/catalogo.model');

const obtenerCatalogo = async (req, res) => {
    try {
        const catalogoDB = await Catalogo.find();
        res.status(200).json({ success: true, total: catalogoDB.length, data: catalogoDB });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al obtener el catálogo", error: error.message });
    }
};

const crearCatalogoItem = async (req, res) => {
    try {
        const { tipo, descripcion, costo, esServicio, stock } = req.body;
        const imagen = req.file ? `/uploads/${req.file.filename}` : '';

        if (!tipo || !descripcion || costo === undefined || costo === null) {
            return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios" });
        }

        const esServicioBool = esServicio === 'true' || esServicio === true;
        const stockVal = esServicioBool ? 0 : (Number(stock) || 0);

        const nuevoItem = new Catalogo({ 
            tipo, 
            descripcion, 
            costo, 
            imagen, 
            esServicio: esServicioBool, 
            stock: stockVal 
        });
        const itemGuardado = await nuevoItem.save();

        res.status(201).json({
            success: true,
            mensaje: "Item agregado al catálogo con éxito",
            data: itemGuardado
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al guardar", error: error.message });
    }
};

const eliminarCatalogoItem = async (req, res) => {
    try {
        const { id } = req.params;
        const itemEliminado = await Catalogo.findByIdAndDelete(id);

        if (!itemEliminado) {
            return res.status(404).json({ success: false, mensaje: "Item no encontrado en el catálogo" });
        }

        res.status(200).json({
            success: true,
            mensaje: "Item eliminado con éxito",
            data: itemEliminado
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al eliminar el item", error: error.message });
    }
};

const actualizarCatalogoItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, descripcion, costo, esServicio, stock } = req.body;

        const esServicioBool = esServicio === 'true' || esServicio === true;
        let datosActualizados = { 
            tipo, 
            descripcion, 
            costo, 
            esServicio: esServicioBool,
            stock: esServicioBool ? 0 : (Number(stock) || 0)
        };
        
        if (req.file) {
            datosActualizados.imagen = `/uploads/${req.file.filename}`;
        }

        const itemActualizado = await Catalogo.findByIdAndUpdate(
            id, 
            datosActualizados, 
            { new: true, runValidators: true }
        );

        if (!itemActualizado) {
            return res.status(404).json({ success: false, mensaje: "Item no encontrado para actualizar" });
        }

        res.status(200).json({
            success: true,
            mensaje: "Item actualizado con éxito",
            data: itemActualizado
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al actualizar el item", error: error.message });
    }
};

module.exports = { 
    obtenerCatalogo, 
    crearCatalogoItem, 
    eliminarCatalogoItem, 
    actualizarCatalogoItem 
};