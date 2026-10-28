require('dotenv').config(); // Recargar .env actualizado
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./database/db');
const fs = require('fs');
const path = require('path');

// Asegurar existencia de carpeta uploads en cualquier servidor o contenedor
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Importar rutas
const solicitudesRoutes = require('./routes/solicitudes.routes');
const catalogoRoutes = require('./routes/catalogo.routes');
const carruselRoutes = require('./routes/carrusel.routes');
const testimonioRoutes = require('./routes/testimonio.routes');
const iaRoutes = require('./routes/ia.routes');
const contactoRoutes = require('./routes/contacto.routes');
const authRoutes = require('./routes/auth.routes');
const registroGeneticoRoutes = require('./routes/registro_genetico.routes');
const ordenesRoutes = require('./routes/orden.routes');
const nosotrosRoutes = require('./routes/nosotros.routes');
const notificacionRoutes = require('./routes/notificacion.routes');
const fincasRoutes = require('./routes/fincas.routes');
const { iniciarCron } = require('./services/cron.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
conectarDB();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/app-veterinario', express.static(path.join(__dirname, '../app-veterinario')));
app.use('/api/nosotros', nosotrosRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// Sockets
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Registrar Endpoints
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/carrusel', carruselRoutes);
app.use('/api/testimonios', testimonioRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/registro-genetico', registroGeneticoRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/fincas', fincasRoutes);
app.use('/api/configuracion', require('./routes/configuracion.routes'));
app.use('/api/pagos', require('./routes/pagos.routes'));

app.get('/api', (req, res) => {
    res.json({ mensaje: 'API REST de Sembriogan inicializada', estado: 'Online' });
});

io.on('connection', (socket) => {
    console.log('⚡ Cliente conectado por WebSocket:', socket.id);
});

// Servir frontend compilado en producción (despliegue fullstack unificado en nube)
const frontendDist = path.join(__dirname, '../frontend-sembriogan/dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/app-veterinario')) {
            return res.sendFile(path.join(frontendDist, 'index.html'));
        }
        next();
    });
}

// Iniciar tareas programadas (Reloj de Notificaciones)
iniciarCron();

server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});