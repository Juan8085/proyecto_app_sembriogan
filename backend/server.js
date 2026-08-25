const express = require('express');
const cors = require('cors');

// Inicializamos la aplicación
const app = express();

// Middlewares
app.use(cors()); // Permite que el frontend (HTML/CSS/JS) haga peticiones a este servidor
app.use(express.json()); // Permite recibir datos en formato JSON

// Ruta de prueba básica
app.get('/', (req, res) => {
    res.json({ mensaje: '¡Servidor de AppSembriogan funcionando correctamente!' });
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Encender el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});