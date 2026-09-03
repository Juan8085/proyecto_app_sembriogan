require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const catalogoRoutes = require('./routes/catalogo.routes');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
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