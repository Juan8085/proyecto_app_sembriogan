require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./database/db');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const catalogoRoutes = require('./routes/catalogo.routes');
const carruselRoutes = require('./routes/carrusel.routes');
const testimonioRoutes = require('./routes/testimonio.routes');
const iaRoutes = require('./routes/ia.routes');
const path = require('path'); // Asegúrate de requerir path si no lo tienes
const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
conectarDB();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// HACER PÚBLICA LA CARPETA DE UPLOADS PARA LAS IMÁGENES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/solicitudes', solicitudesRoutes); // <- ¡Esta línea faltaba!
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

// Levantar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});