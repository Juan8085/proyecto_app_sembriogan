const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // 1. Pedir el "gafete" (Token) que viene en los headers de la petición
    const tokenHeader = req.header('Authorization');

    // 2. Si no trae gafete, le negamos la entrada inmediatamente
    if (!tokenHeader) {
        return res.status(401).json({ success: false, mensaje: "Acceso denegado. Se requiere iniciar sesión." });
    }

    try {
        // 3. El token suele enviarse como "Bearer abcde123...", extraemos solo el código
        const token = tokenHeader.split(' ')[1] || tokenHeader;

        // 4. Verificamos que el token sea auténtico y haya sido firmado por nosotros
        const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'FirmaSecretaSembriogan2026');
        
        // 5. Si es válido, guardamos los datos del usuario logueado en la petición
        req.usuario = decodificado;
        
        // 6. ¡Le abrimos la puerta! Pasa al siguiente controlador
        next();
    } catch (error) {
        res.status(401).json({ success: false, mensaje: "Token inválido o sesión expirada." });
    }
};

// Podemos crear otro vigilante que solo deje pasar a Administradores
const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'Admin') {
        next();
    } else {
        res.status(403).json({ success: false, mensaje: "Acceso denegado. Permisos de Administrador requeridos." });
    }
};

module.exports = { verificarToken, esAdmin };