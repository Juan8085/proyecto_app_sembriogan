require('dotenv').config();
const express = require('express');
const http = require('http'); // Servidor HTTP nativo para Socket.io
const { Server } = require('socket.io'); // Importar Socket.io
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./database/db');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const catalogoRoutes = require('./routes/catalogo.routes');
const carruselRoutes = require('./routes/carrusel.routes');
const testimonioRoutes = require('./routes/testimonio.routes');
const iaRoutes = require('./routes/ia.routes');
const path = require('path');

const app = express();
const server = http.createServer(app); // Creamos el servidor HTTP envolviendo Express
const io = new Server(server, {
    cors: { origin: '*' }
}); // Inicializamos Socket.io con CORS abierto

const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
conectarDB();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/app-veterinario', express.static(path.join(__dirname, '../app-veterinario')));

// Inyectar la instancia de Socket.io en las peticiones (req.io)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rutas de la API
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/carrusel', carruselRoutes);
app.use('/api/testimonios', testimonioRoutes);
app.use('/api/ia', iaRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
    res.json({ 
        mensaje: 'API REST de Sembriogan inicializada correctamente',
        estado: 'Online' 
    });
});

// Evento de conexión de Socket.io
io.on('connection', (socket) => {
    console.log('⚡ Cliente conectado por WebSocket:', socket.id);
});

// IMPORTANTE: Usamos server.listen en lugar de app.listen para activar Socket.io
server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});