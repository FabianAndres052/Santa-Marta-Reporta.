const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./src/config/database');
const reportRoutes = require('./src/routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permitir peticiones de otros orígenes
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear datos de formularios

// Servir archivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, 'public')));
// Servir la carpeta de uploads para que las imágenes sean accesibles públicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/reports', reportRoutes);

// Manejo de errores global de Multer
app.use((err, req, res, next) => {
    if (err instanceof require('multer').MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande. El límite es 5MB.' });
        }
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

// Iniciar el servidor
async function startServer() {
    try {
        // Inicializar la base de datos antes de escuchar peticiones
        await getDb();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor de Santa Marta Reporta iniciado en http://localhost:${PORT}`);
            console.log(`También puedes intentar acceder desde http://127.0.0.1:${PORT}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`El puerto ${PORT} ya está en uso. Por favor, cierra otros programas que puedan estar usándolo.`);
            } else {
                console.error(err);
            }
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();
