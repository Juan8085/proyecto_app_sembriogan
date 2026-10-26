const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // 1. Pedir el "gafete" (Token) que viene en los headers de la petición
    const tokenHeader = req.header('Authorization') || req.header('authorization');

    // 2. Si no trae gafete, le negamos la entrada inmediatamente
    if (!tokenHeader) {
        return res.status(401).json({ 
            success: false, 
            sesionExpirada: true,
            mensaje: "Acceso denegado. Se requiere iniciar sesión." 
        });
    }

    try {
        // 3. El token suele enviarse como "Bearer abcde123...", extraemos solo el código
        let token = tokenHeader;
        if (tokenHeader.startsWith('Bearer ') || tokenHeader.startsWith('bearer ')) {
            token = tokenHeader.slice(7).trim();
        }

        // Limpiar comillas si vienen en el string
        token = token.replace(/^["']|["']$/g, '').trim();

        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ 
                success: false, 
                sesionExpirada: true,
                mensaje: "Token no proporcionado o sesión cerrada." 
            });
        }

        // 4. Verificamos que el token sea auténtico y haya sido firmado por nosotros
        const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'FirmaSecretaSembriogan2026');
        
        // 5. Si es válido, guardamos los datos del usuario logueado en la petición
        req.usuario = decodificado;
        
        // 6. ¡Le abrimos la puerta! Pasa al siguiente controlador
        next();
    } catch (error) {
        console.warn(`⚠️ [Auth Middleware] Error al verificar token (${req.method} ${req.originalUrl}):`, error.name, error.message);
        const esExpirado = error.name === 'TokenExpiredError';
        res.status(401).json({ 
            success: false, 
            sesionExpirada: true,
            mensaje: esExpirado ? "Sesión expirada. Por favor vuelve a iniciar sesión." : "Token inválido o sesión expirada." 
        });
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