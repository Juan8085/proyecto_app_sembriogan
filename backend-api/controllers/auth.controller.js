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
            rol: rolAsignado,
            estado: true // Aseguramos que nace activo por defecto
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

        // CORRECCIÓN: Solo bloquear si el estado es estrictamente FALSE
        if (usuario.estado === false) {
            return res.status(401).json({ success: false, mensaje: "Usuario inactivo. Contacte al administrador." });
        }

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ success: false, mensaje: "Contraseña incorrecta" });
        }

        // Generar Token (JWT)
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

// 3. OBTENER TODOS LOS USUARIOS (Para el Panel Admin)
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: usuarios });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. ACTUALIZAR / DESACTIVAR / CAMBIAR CLAVE DE USUARIO
const actualizarUsuarioAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, rol, estado, password } = req.body;
        
        let datosActualizar = {};
        if (nombre !== undefined) datosActualizar.nombre = nombre;
        if (rol !== undefined) datosActualizar.rol = rol;
        if (estado !== undefined) datosActualizar.estado = estado;

        // Si el admin escribió una nueva contraseña, la encriptamos
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

module.exports = { registrarUsuario, loginUsuario, obtenerUsuarios, actualizarUsuarioAdmin };