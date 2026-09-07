require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./database/db');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const catalogoRoutes = require('./routes/catalogo.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
conectarDB();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas de la API
app.use('/api/solicitudes', solicitudesRoutes); // <- ¡Esta línea faltaba!

app.use('/api/catalogo', catalogoRoutes);

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