require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
conectarDB(); // <- Ejecutar conexión

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


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