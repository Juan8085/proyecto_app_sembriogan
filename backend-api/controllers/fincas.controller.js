const Finca = require('../models/finca.model');

// 1. Obtener todas las fincas con soporte de filtros y estadísticas consolidadas
const obtenerFincas = async (req, res) => {
    try {
        const { email, search, municipio } = req.query;
        let filtro = {};

        if (email) {
            filtro.propietarioEmail = email.toLowerCase().trim();
        }

        if (municipio && municipio !== 'todos') {
            filtro.municipio = new RegExp(municipio, 'i');
        }

        if (search) {
            const regex = new RegExp(search.trim(), 'i');
            filtro.$or = [
                { nombreFinca: regex },
                { propietarioNombre: regex },
                { propietarioEmail: regex },
                { municipio: regex },
                { vereda: regex }
            ];
        }

        const fincas = await Finca.find(filtro).sort({ createdAt: -1 });

        // Calcular estadísticas
        const totalFincas = fincas.length;
        const totalAnimales = fincas.reduce((sum, f) => sum + (Number(f.numeroAnimales) || 0), 0);
        const totalHectareas = fincas.reduce((sum, f) => sum + (Number(f.hectareas) || 0), 0);
        const municipiosUnicos = [...new Set(fincas.map(f => f.municipio).filter(Boolean))];
        const clientesUnicos = [...new Set(fincas.map(f => f.propietarioEmail || f.propietarioNombre).filter(Boolean))];

        res.status(200).json({
            success: true,
            data: fincas,
            stats: {
                totalFincas,
                totalAnimales,
                totalHectareas,
                municipiosCount: municipiosUnicos.length,
                municipios: municipiosUnicos,
                clientesCount: clientesUnicos.length
            }
        });
    } catch (error) {
        console.error("Error al obtener fincas:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Registrar nueva finca con geolocalización GPS
const crearFinca = async (req, res) => {
    try {
        const {
            nombreFinca,
            propietarioNombre,
            propietarioEmail,
            propietarioTelefono,
            departamento,
            municipio,
            vereda,
            coordenadas,
            numeroAnimales,
            hectareas,
            tipoProduccion,
            notas,
            registradoPor
        } = req.body;

        if (!nombreFinca || !propietarioNombre || !municipio) {
            return res.status(400).json({
                success: false,
                mensaje: "El nombre de la finca, propietario y municipio son obligatorios."
            });
        }

        if (!coordenadas || coordenadas.lat === undefined || coordenadas.lng === undefined) {
            return res.status(400).json({
                success: false,
                mensaje: "Las coordenadas GPS (latitud y longitud) son obligatorias para la geolocalización."
            });
        }

        const nuevaFinca = new Finca({
            nombreFinca: nombreFinca.trim(),
            propietarioNombre: propietarioNombre.trim(),
            propietarioEmail: (propietarioEmail || '').toLowerCase().trim(),
            propietarioTelefono: (propietarioTelefono || '').trim(),
            departamento: departamento || 'Huila',
            municipio: municipio.trim(),
            vereda: (vereda || '').trim(),
            coordenadas: {
                lat: parseFloat(coordenadas.lat),
                lng: parseFloat(coordenadas.lng)
            },
            numeroAnimales: Number(numeroAnimales) || 0,
            hectareas: Number(hectareas) || 0,
            tipoProduccion: tipoProduccion || 'Doble Propósito',
            notas: (notas || '').trim(),
            registradoPor: registradoPor || 'Cliente'
        });

        await nuevaFinca.save();

        if (req.io) {
            req.io.emit('nueva_finca', nuevaFinca);
        }

        res.status(201).json({
            success: true,
            mensaje: "Finca georreferenciada guardada exitosamente.",
            data: nuevaFinca
        });
    } catch (error) {
        console.error("Error al crear finca:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Actualizar finca existente
const actualizarFinca = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.coordenadas) {
            updates.coordenadas.lat = parseFloat(updates.coordenadas.lat);
            updates.coordenadas.lng = parseFloat(updates.coordenadas.lng);
        }

        if (updates.propietarioEmail) {
            updates.propietarioEmail = updates.propietarioEmail.toLowerCase().trim();
        }

        const fincaActualizada = await Finca.findByIdAndUpdate(id, updates, { new: true });

        if (!fincaActualizada) {
            return res.status(404).json({ success: false, mensaje: "Finca no encontrada." });
        }

        res.status(200).json({
            success: true,
            mensaje: "Información de la finca actualizada correctamente.",
            data: fincaActualizada
        });
    } catch (error) {
        console.error("Error al actualizar finca:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. Eliminar finca
const eliminarFinca = async (req, res) => {
    try {
        const { id } = req.params;
        const fincaEliminada = await Finca.findByIdAndDelete(id);

        if (!fincaEliminada) {
            return res.status(404).json({ success: false, mensaje: "Finca no encontrada." });
        }

        res.status(200).json({
            success: true,
            mensaje: "Finca eliminada de la base de geolocalización."
        });
    } catch (error) {
        console.error("Error al eliminar finca:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerFincas,
    crearFinca,
    actualizarFinca,
    eliminarFinca
};
