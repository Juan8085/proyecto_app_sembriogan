const RegistroGenetico = require('../models/registro_genetico.model');

// Obtener todo el historial (Para el Admin o filtrado para el cliente)
const obtenerRegistros = async (req, res) => {
    try {
        const { email } = req.query;
        let query = {};
        if (email) {
            query = { productorEmail: email };
        }
        // Ordenamos por la fecha de creación para ver los más recientes primero
        const registros = await RegistroGenetico.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: registros });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo registro en campo (Para la App del Veterinario)
const crearRegistro = async (req, res) => {
    try {
        // req.body ya trae la estructura exacta desde la PWA (arete, productor, fechasProtocolo...)
        if (!req.body.fechasProtocolo) {
            req.body.fechasProtocolo = { dia0_sincronizacion: new Date() };
        } else if (!req.body.fechasProtocolo.dia0_sincronizacion) {
            req.body.fechasProtocolo.dia0_sincronizacion = new Date();
        }

        const nuevoRegistro = new RegistroGenetico(req.body);
        
        // Asignar el veterinario que viene del token de sesión
        if (req.usuario && req.usuario.nombre) {
            nuevoRegistro.veterinarioAsignado = req.usuario.nombre;
        } else if (req.usuario && req.usuario.id) {
            const Usuario = require('../models/usuario.model');
            const u = await Usuario.findById(req.usuario.id);
            if (u && u.nombre) {
                nuevoRegistro.veterinarioAsignado = u.nombre;
            }
        }

        // NOTA: No necesitamos sumar los 45 días aquí manualmente. 
        // El middleware pre('save') que pusimos en registro_genetico.model.js 
        // se encarga de calcular exactamente los días 8, 10, 17, 45 y 90.

        await nuevoRegistro.save();

        // Auto-georreferenciar la finca si se envían coordenadas y nombre de finca
        if (req.body.coordenadas && req.body.coordenadas.lat && req.body.coordenadas.lng && req.body.finca) {
            try {
                const Finca = require('../models/finca.model');
                const nombreF = req.body.finca.trim();
                const propietarioN = (req.body.productor || '').trim();
                const existente = await Finca.findOne({
                    nombreFinca: new RegExp('^' + nombreF + '$', 'i')
                });
                if (!existente) {
                    await Finca.create({
                        nombreFinca: nombreF,
                        propietarioNombre: propietarioN || 'Productor Ganadero',
                        propietarioEmail: req.body.productorEmail || '',
                        municipio: req.body.municipio || 'Neiva',
                        coordenadas: {
                            lat: parseFloat(req.body.coordenadas.lat),
                            lng: parseFloat(req.body.coordenadas.lng)
                        },
                        registradoPor: 'Veterinario'
                    });
                }
            } catch (fErr) {
                console.error("Aviso: no se pudo auto-vincular finca:", fErr.message);
            }
        }

        // Notificar al admin en tiempo real
        if(req.io) {
            req.io.emit('nuevo-registro-genetico');
        }

        res.status(201).json({ success: true, mensaje: "Registro genético guardado con éxito", data: nuevoRegistro });
    } catch (error) {
        console.error("Error en el backend al crear registro:", error);
        res.status(500).json({ success: false, error: error.message, mensaje: "Error del servidor al guardar el registro." });
    }
};

// Actualizar resultado de preñez (Cuando el Vet vuelve a palpar)
const actualizarPrenez = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoPrenez, observaciones } = req.body;
        
        const actualizado = await RegistroGenetico.findByIdAndUpdate(
            id, 
            { estadoPrenez, observaciones }, 
            { new: true }
        );

        if(req.io) req.io.emit('nuevo-registro-genetico');

        res.status(200).json({ success: true, mensaje: "Diagnóstico actualizado", data: actualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar avance del protocolo (Día 8, 10, 17)
const actualizarPaso = async (req, res) => {
    try {
        const { id } = req.params;
        const { paso } = req.body; // 'dia8_retiro', 'dia10_inseminacion', etc.
        
        const updateObj = {};
        updateObj[`pasosCompletados.${paso}`] = true;
        
        const actualizado = await RegistroGenetico.findByIdAndUpdate(
            id,
            { $set: updateObj },
            { new: true }
        );

        if(req.io) req.io.emit('nuevo-registro-genetico');

        res.status(200).json({ success: true, mensaje: "Paso del protocolo actualizado", data: actualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { obtenerRegistros, crearRegistro, actualizarPrenez, actualizarPaso };