require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./database/db');
const path = require('path');

// Importar rutas
const solicitudesRoutes = require('./routes/solicitudes.routes');
const catalogoRoutes = require('./routes/catalogo.routes');
const carruselRoutes = require('./routes/carrusel.routes');
const testimonioRoutes = require('./routes/testimonio.routes');
const iaRoutes = require('./routes/ia.routes');
const contactoRoutes = require('./routes/contacto.routes');
const authRoutes = require('./routes/auth.routes');

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

app.get('/api', (req, res) => {
    res.json({ mensaje: 'API REST de Sembriogan inicializada', estado: 'Online' });
});

io.on('connection', (socket) => {
    console.log('⚡ Cliente conectado por WebSocket:', socket.id);
});

server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});