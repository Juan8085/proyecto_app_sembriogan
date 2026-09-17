const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTRAR UN NUEVO USUARIO
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Verificar si ya existe el correo
        const existeUsuario = await Usuario.findOne({ email });
        if (existeUsuario) {
            return res.status(400).json({ success: false, mensaje: "El correo ya está registrado" });
        }

        // REGLA INTELIGENTE: Contar cuántos usuarios hay en total en la BD
        const totalUsuarios = await Usuario.countDocuments();

        let rolAsignado = rol || 'Cliente';

        // Si la base de datos está COMPLETAMENTE VACÍA, el primer usuario SERÁ ADMIN por fuerza
        if (totalUsuarios === 0) {
            rolAsignado = 'Admin';
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptado = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password: passwordEncriptado,
            rol: rolAsignado
        });

        await nuevoUsuario.save();
        res.status(201).json({ success: true, mensaje: `Usuario registrado con éxito como ${rolAsignado}` });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. INICIAR SESIÓN (LOGIN)
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar el usuario por email
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ success: false, mensaje: "Usuario no encontrado" });
        }

        if (!usuario.estado) {
            return res.status(401).json({ success: false, mensaje: "Usuario inactivo. Contacte al administrador." });
        }

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ success: false, mensaje: "Contraseña incorrecta" });
        }

        // Generar Token (JWT)
        // Usamos una clave secreta (debería ir en el .env, pero la pondremos directa por ahora)
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol }, 
            process.env.JWT_SECRET || 'FirmaSecretaSembriogan2026', 
            { expiresIn: '8h' } // El token expira en 8 horas de jornada laboral
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

module.exports = { registrarUsuario, loginUsuario };