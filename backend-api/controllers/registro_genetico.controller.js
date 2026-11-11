const RegistroGenetico = require('../models/registro_genetico.model');

// Obtener todo el historial (Para el Admin o filtrado para el cliente)
const obtenerRegistros = async (req, res) => {
    try {
        const { email } = req.query;
        // Solo registros con correo electrónico válido (Requerimiento Sembriogan)
        let query = {
            productorEmail: { $exists: true, $ne: '', $regex: '@' }
        };
        if (email) {
            query.productorEmail = email.trim().toLowerCase();
        }
        // Ordenamos por la fecha de creación para ver los más recientes primero
        const registros = await RegistroGenetico.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: registros });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo registro / visita programada (Desde el Panel Administrativo o App Móvil)
const crearRegistro = async (req, res) => {
    try {
        // req.body trae los datos desde el panel administrativo o app móvil
        if (!req.body.fechasProtocolo) {
            req.body.fechasProtocolo = { dia0_sincronizacion: new Date() };
        } else if (!req.body.fechasProtocolo.dia0_sincronizacion) {
            req.body.fechasProtocolo.dia0_sincronizacion = new Date();
        }

        // Si la genética o toro no se especificó o quedó pendiente de selección
        if (!req.body.geneticaUtilizada || !req.body.geneticaUtilizada.trim() || req.body.toroPendiente) {
            req.body.geneticaUtilizada = 'Pendiente de Selección';
        }

        // Asegurar que las coordenadas GPS sean numéricas válidas si se enviaron
        if (req.body.coordenadas && req.body.coordenadas.lat && req.body.coordenadas.lng) {
            req.body.coordenadas = {
                lat: parseFloat(req.body.coordenadas.lat),
                lng: parseFloat(req.body.coordenadas.lng)
            };
        }

        // Datos del productor para sincronización automática
        const nombreProductor = (req.body.productor || '').trim();
        let emailCliente = req.body.productorEmail ? req.body.productorEmail.trim().toLowerCase() : '';
        const telefonoProductor = (req.body.telefonoProductor || req.body.telefono || '').trim();
        const fincaProductor = (req.body.finca || '').trim();
        const municipioProductor = (req.body.municipio || 'Neiva, Huila').trim();
        const tipoProduccion = req.body.tipoProduccion || req.body.tipoProduccionFinca || 'Doble Propósito';

        // Si no se digitó correo en campo u oficina, vincular por nombre existente o generar uno para su perfil
        if (!emailCliente && nombreProductor) {
            try {
                const Usuario = require('../models/usuario.model');
                const userExistente = await Usuario.findOne({ 
                    nombre: new RegExp('^' + nombreProductor.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
                });
                if (userExistente && userExistente.email) {
                    emailCliente = userExistente.email;
                } else {
                    const slug = nombreProductor.toLowerCase().replace(/[^a-z0-9]/g, '');
                    emailCliente = `cliente.${slug || Date.now()}@sembriogan.com`;
                }
            } catch (e) {
                const slug = nombreProductor.toLowerCase().replace(/[^a-z0-9]/g, '');
                emailCliente = `cliente.${slug || Date.now()}@sembriogan.com`;
            }
        }
        req.body.productorEmail = emailCliente;
        req.body.telefonoProductor = telefonoProductor;
        req.body.finca = fincaProductor;
        req.body.municipio = municipioProductor;

        const nuevoRegistro = new RegistroGenetico(req.body);
        
        // Asignar el veterinario que viene del body o del token de sesión
        if (req.body.veterinarioAsignado && req.body.veterinarioAsignado.trim()) {
            nuevoRegistro.veterinarioAsignado = req.body.veterinarioAsignado.trim();
        } else if (req.usuario && req.usuario.nombre) {
            nuevoRegistro.veterinarioAsignado = req.usuario.nombre;
        } else if (req.usuario && req.usuario.id) {
            const Usuario = require('../models/usuario.model');
            const u = await Usuario.findById(req.usuario.id);
            if (u && u.nombre) {
                nuevoRegistro.veterinarioAsignado = u.nombre;
            }
        }

        // El middleware pre('save') en registro_genetico.model.js calcula automáticamente días 8, 10, 17, 45 y 90
        await nuevoRegistro.save();
        console.log(`✅ [RegistroGenetico] Guardado con éxito: Animal ${nuevoRegistro.arete} (${nuevoRegistro.tipoProcedimiento}) - Productor: ${nuevoRegistro.productor}`);

        // =============================================================
        // 1. AUTO-REGISTRO DE CLIENTE GANADERO (Requerimiento Sembriogan)
        // =============================================================
        if (emailCliente && nombreProductor) {
            try {
                const Usuario = require('../models/usuario.model');
                const bcrypt = require('bcryptjs');
                let usuarioCliente = await Usuario.findOne({ email: emailCliente });
                
                if (!usuarioCliente) {
                    // Generar contraseña aleatoria segura (ej: Sembrio8492!)
                    const claveAleatoria = 'Sembrio' + Math.floor(1000 + Math.random() * 9000) + '!';
                    const salt = await bcrypt.genSalt(10);
                    const passwordHash = await bcrypt.hash(claveAleatoria, salt);

                    usuarioCliente = new Usuario({
                        nombre: nombreProductor,
                        email: emailCliente,
                        password: passwordHash,
                        rol: 'Cliente',
                        telefono: telefonoProductor,
                        fincaPrincipal: fincaProductor,
                        municipio: municipioProductor,
                        tipoProduccion: tipoProduccion,
                        estado: true
                    });
                    await usuarioCliente.save();
                    console.log(`👤 [Auto-Cliente] Ganadero "${nombreProductor}" registrado como Cliente con correo: ${emailCliente}`);
                } else {
                    // Si ya existe, completar campos vacíos
                    let modificado = false;
                    if (!usuarioCliente.telefono && telefonoProductor) {
                        usuarioCliente.telefono = telefonoProductor;
                        modificado = true;
                    }
                    if (!usuarioCliente.fincaPrincipal && fincaProductor) {
                        usuarioCliente.fincaPrincipal = fincaProductor;
                        modificado = true;
                    }
                    if (modificado) await usuarioCliente.save();
                }
            } catch (userErr) {
                console.error("Aviso al auto-registrar usuario cliente:", userErr.message);
            }
        }

        // =============================================================
        // 2. AUTO-REGISTRO DE LA FINCA EN EL DIRECTORIO GPS
        // =============================================================
        if (fincaProductor) {
            try {
                const Finca = require('../models/finca.model');
                const existente = await Finca.findOne({
                    nombreFinca: new RegExp('^' + fincaProductor + '$', 'i')
                });
                if (!existente) {
                    await Finca.create({
                        nombreFinca: fincaProductor,
                        propietarioNombre: nombreProductor || 'Productor Ganadero',
                        propietarioEmail: emailCliente,
                        propietarioTelefono: telefonoProductor,
                        municipio: municipioProductor,
                        tipoProduccion: tipoProduccion,
                        coordenadas: (req.body.coordenadas && req.body.coordenadas.lat) ? {
                            lat: parseFloat(req.body.coordenadas.lat),
                            lng: parseFloat(req.body.coordenadas.lng)
                        } : { lat: 2.9273, lng: -75.2819 },
                        registradoPor: req.body.origenRegistro || 'Oficina / Administrativo'
                    });
                    console.log(`📍 [Finca] Finca "${fincaProductor}" registrada en el directorio.`);
                    if (req.io) {
                        req.io.emit('nueva-finca');
                    }
                }
            } catch (fErr) {
                console.error("Aviso: no se pudo auto-vincular finca:", fErr.message);
            }
        }

        // =============================================================
        // 3. NOTIFICACIÓN PUSH Y WEBSOCKET A TODOS LOS VETERINARIOS
        // =============================================================
        if (req.io) {
            req.io.emit('nuevo-registro-genetico', nuevoRegistro);
            req.io.emit('nueva-visita-programada', nuevoRegistro);
        }

        // Enviar notificación Push a los dispositivos móviles de los veterinarios
        try {
            const Suscripcion = require('../models/suscripcion.model');
            const webpush = require('web-push');
            const suscripciones = await Suscripcion.find();
            if (suscripciones && suscripciones.length > 0) {
                const payload = JSON.stringify({
                    title: `🔔 Visita Programada: ${nuevoRegistro.tipoProcedimiento}`,
                    body: `${nuevoRegistro.productor} - Finca: ${nuevoRegistro.finca || 'Sembriogan'} (${nuevoRegistro.arete}).`,
                    url: '/app-veterinario-mobile'
                });
                for (let sub of suscripciones) {
                    webpush.sendNotification(sub, payload).catch(() => {});
                }
            }
        } catch (pushErr) {
            // Ignorar silenciosamente si no hay configuración VAPID
        }

        res.status(201).json({ 
            success: true, 
            mensaje: "Procedimiento y visita técnica registrados con éxito. Sincronizado con la app de veterinarios.", 
            data: nuevoRegistro 
        });
    } catch (error) {
        console.error("Error en el backend al crear registro:", error);
        res.status(500).json({ success: false, error: error.message, mensaje: "Error del servidor al guardar el registro." });
    }
};

// Actualizar resultado de preñez y genética (Cuando el Vet palpa o registra el toro en campo)
const actualizarPrenez = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoPrenez, observaciones, geneticaUtilizada, veterinarioAsignado } = req.body;
        
        const updateData = {};
        if (estadoPrenez !== undefined) updateData.estadoPrenez = estadoPrenez;
        if (observaciones !== undefined) updateData.observaciones = observaciones;
        if (geneticaUtilizada !== undefined && geneticaUtilizada.trim() !== '') {
            updateData.geneticaUtilizada = geneticaUtilizada.trim();
        }
        if (veterinarioAsignado !== undefined && veterinarioAsignado.trim() !== '') {
            updateData.veterinarioAsignado = veterinarioAsignado.trim();
        }

        const actualizado = await RegistroGenetico.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { returnDocument: 'after' }
        );

        if (req.io) {
            req.io.emit('nuevo-registro-genetico', actualizado);
            req.io.emit('actualizacion-procedimiento', actualizado);
        }

        res.status(200).json({ success: true, mensaje: "Ficha clínica y genética actualizada", data: actualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar avance del protocolo (Día 8, 10, 17) con opción de registrar toro/genética en campo
const actualizarPaso = async (req, res) => {
    try {
        const { id } = req.params;
        const { paso, geneticaUtilizada } = req.body; // 'dia8_retiro', 'dia10_inseminacion', etc.
        
        const updateObj = {};
        updateObj[`pasosCompletados.${paso}`] = true;

        // Si en el día de la inseminación o transferencia se define el toro:
        if (geneticaUtilizada && geneticaUtilizada.trim() !== '' && geneticaUtilizada !== 'Pendiente de Selección') {
            updateObj.geneticaUtilizada = geneticaUtilizada.trim();
        }
        
        const actualizado = await RegistroGenetico.findByIdAndUpdate(
            id,
            { $set: updateObj },
            { returnDocument: 'after' }
        );

        if (req.io) {
            req.io.emit('nuevo-registro-genetico', actualizado);
            req.io.emit('actualizacion-procedimiento', actualizado);
        }

        res.status(200).json({ success: true, mensaje: "Paso del protocolo actualizado con éxito", data: actualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { obtenerRegistros, crearRegistro, actualizarPrenez, actualizarPaso };