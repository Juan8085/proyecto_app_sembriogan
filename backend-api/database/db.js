// backend-api/database/db.js
const mongoose = require('mongoose');

const conectarDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ ERROR FATAL: La variable de entorno MONGODB_URI no está configurada.');
            console.error('Por favor define MONGODB_URI en tus variables de entorno o archivo .env.');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Base de datos MongoDB conectada exitosamente 🍃');
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = conectarDB;