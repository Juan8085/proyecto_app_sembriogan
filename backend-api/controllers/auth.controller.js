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

        const existeUsuario = await Usuario.findOne({ email });
        if (existeUsuario) {
            return res.status(400).json({ success: false, mensaje: "El correo ya está registrado" });
        }

        const totalUsuarios = await Usuario.countDocuments();
        let rolAsignado = rol || 'Cliente';

        if (totalUsuarios === 0) {
            rolAsignado = 'Admin';
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptado = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password: passwordEncriptado,
            rol: rolAsignado,
            estado: true
        });

        await nuevoUsuario.save();
        res.status(201).json({ success: true, mensaje: `Usuario registrado con éxito como ${rolAsignado}` });

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
            { id: usuario._id, rol: usuario.rol }, 
            process.env.JWT_SECRET || 'FirmaSecretaSembriogan2026', 
            { expiresIn: '8h' }
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
        const { token } = req.body; // Token de Google enviado desde el frontend

        // Verificar el token con la API de Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { name, email } = payload;

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

        // Generar el Token JWT propio de la plataforma
        const jwtToken = jwt.sign(
            { id: usuario._id, rol: usuario.rol }, 
            process.env.JWT_SECRET || 'FirmaSecretaSembriogan2026', 
            { expiresIn: '8h' }
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

// 5. ACTUALIZAR / DESACTIVAR / CAMBIAR CLAVE DE USUARIO
const actualizarUsuarioAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, rol, estado, password } = req.body;
        
        let datosActualizar = {};
        if (nombre !== undefined) datosActualizar.nombre = nombre;
        if (rol !== undefined) datosActualizar.rol = rol;
        if (estado !== undefined) datosActualizar.estado = estado;

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            datosActualizar.password = await bcrypt.hash(password, salt);
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, datosActualizar, { new: true }).select('-password');
        
        res.status(200).json({ success: true, mensaje: "Usuario actualizado correctamente", data: usuarioActualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { 
    registrarUsuario, 
    loginUsuario, 
    googleLogin, 
    obtenerUsuarios, 
    actualizarUsuarioAdmin 
};