const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Inicializar cliente de Google (Requiere GOOGLE_CLIENT_ID en tu archivo .env)
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 1. REGISTRAR UN NUEVO USUARIO (Tradicional)
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ success: false, mensaje: "Nombre, correo y contraseña son obligatorios" });
        }

        const emailLimpio = (email || '').toLowerCase().trim();
        const existeUsuario = await Usuario.findOne({ email: emailLimpio });
        if (existeUsuario) {
            return res.status(400).json({ success: false, mensaje: "El correo ya está registrado por otro usuario" });
        }

        const totalUsuarios = await Usuario.countDocuments();
        let rolAsignado = rol || 'Cliente';

        if (totalUsuarios === 0) {
            rolAsignado = 'Admin';
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptado = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({
            nombre: (nombre || '').trim(),
            email: emailLimpio,
            password: passwordEncriptado,
            rol: rolAsignado,
            estado: true
        });

        await nuevoUsuario.save();
        res.status(201).json({ 
            success: true, 
            mensaje: `Usuario registrado con éxito como ${rolAsignado}`,
            data: {
                id: nuevoUsuario._id,
                _id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol,
                estado: nuevoUsuario.estado
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. INICIAR SESIÓN (Tradicional)
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ success: false, mensaje: "Usuario no encontrado" });
        }

        if (usuario.estado === false) {
            return res.status(401).json({ success: false, mensaje: "Usuario inactivo. Contacte al administrador." });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ success: false, mensaje: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre, email: usuario.email }, 
            process.env.JWT_SECRET || 'FirmaSecretaSembriogan2026', 
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            mensaje: "Login exitoso",
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. NUEVO: AUTENTICACIÓN / REGISTRO CON GOOGLE
const googleLogin = async (req, res) => {
    try {
        const { token, userInfo } = req.body; // Token o UserInfo de Google enviado desde el frontend

        let name, email;

        if (userInfo && userInfo.email) {
            name = userInfo.name || userInfo.email.split('@')[0];
            email = userInfo.email;
        } else if (token) {
            // Verificar el token con la API de Google
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
        } else {
            return res.status(400).json({ success: false, mensaje: "Datos de Google no proporcionados" });
        }

        // Comprobar si el usuario ya se encuentra registrado
        let usuario = await Usuario.findOne({ email });

        if (!usuario) {
            // Si no existe, lo registramos automáticamente como 'Cliente'
            // Creamos una contraseña aleatoria y encriptada para cumplir con el esquema
            const salt = await bcrypt.genSalt(10);
            const passwordAleatorio = await bcrypt.hash(Math.random().toString() + Date.now(), salt);

            usuario = new Usuario({
                nombre: name,
                email,
                password: passwordAleatorio,
                rol: 'Cliente',
                estado: true
            });
            await usuario.save();
        }

        if (usuario.estado === false) {
            return res.status(401).json({ success: false, mensaje: "Usuario inactivo. Contacte al administrador." });
        }

        // Generar el Token JWT propio de la plataforma (30 días de vigencia)
        const jwtToken = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre, email: usuario.email }, 
            process.env.JWT_SECRET || 'FirmaSecretaSembriogan2026', 
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            mensaje: "Autenticación con Google exitosa",
            token: jwtToken,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error al autenticar con Google", error: error.message });
    }
};

// 4. OBTENER TODOS LOS USUARIOS (Para el Panel Admin)
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: usuarios });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 5. ACTUALIZAR INFORMACIÓN / CAMBIAR CLAVE DE USUARIO
const actualizarUsuarioAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, estado, password } = req.body;
        
        let datosActualizar = {};
        if (nombre !== undefined && nombre.trim() !== "") {
            datosActualizar.nombre = nombre.trim();
        }
        
        if (email !== undefined && email.trim() !== "") {
            const emailLimpio = email.toLowerCase().trim();
            // Comprobar que el correo no esté ocupado por otra cuenta
            const correoExistente = await Usuario.findOne({ email: emailLimpio, _id: { $ne: id } });
            if (correoExistente) {
                return res.status(400).json({ success: false, mensaje: "Este correo electrónico ya está registrado por otro usuario" });
            }
            datosActualizar.email = emailLimpio;
        }

        if (rol !== undefined) datosActualizar.rol = rol;
        if (estado !== undefined) datosActualizar.estado = estado;

        if (password && password.trim() !== "") {
            if (password.length < 6) {
                return res.status(400).json({ success: false, mensaje: "La nueva contraseña debe tener al menos 6 caracteres" });
            }
            const salt = await bcrypt.genSalt(10);
            datosActualizar.password = await bcrypt.hash(password, salt);
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, datosActualizar, { new: true }).select('-password');
        
        if (!usuarioActualizado) {
            return res.status(404).json({ success: false, mensaje: "Usuario no encontrado" });
        }

        res.status(200).json({ 
            success: true, 
            mensaje: "Información de usuario actualizada correctamente", 
            usuario: {
                id: usuarioActualizado._id,
                _id: usuarioActualizado._id,
                nombre: usuarioActualizado.nombre,
                email: usuarioActualizado.email,
                rol: usuarioActualizado.rol,
                estado: usuarioActualizado.estado
            },
            data: usuarioActualizado 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 6. VERIFICAR SESIÓN ACTIVA (Para App Móvil y Frontend)
const verificarSesion = async (req, res) => {
    try {
        res.status(200).json({ 
            success: true, 
            mensaje: "Sesión activa y válida",
            usuario: req.usuario 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { 
    registrarUsuario, 
    loginUsuario, 
    googleLogin, 
    obtenerUsuarios, 
    actualizarUsuarioAdmin,
    verificarSesion 
};