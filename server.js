const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./src/config/database');
const reportRoutes = require('./src/routes/reportRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const INITIAL_PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors()); // Permitir peticiones de otros orígenes
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear datos de formularios

// Servir archivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, 'public')));
// Servir la carpeta de uploads para que las imágenes sean accesibles públicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de portales separados
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/ciudadano', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de la API
app.use('/api/auth', authRoutes);
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

// Iniciar el servidor con fallback inteligente si el puerto está en uso
function startListening(port) {
    const srv = app.listen(port, () => {
        console.log(`\n=============================================================`);
        console.log(`✅ Servidor de Santa Marta Reporta iniciado con éxito`);
        console.log(`   🌐 Portal Ciudadano:       http://localhost:${port}/ciudadano (o http://localhost:${port}/)`);
        console.log(`   🛡️  Portal Administrativo:  http://localhost:${port}/admin`);
        console.log(`=============================================================\n`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  El puerto ${port} está ocupado por otra aplicación. Probando puerto alternativo ${port + 1}...`);
            startListening(port + 1);
        } else {
            console.error('Error al iniciar el servidor:', err);
            process.exit(1);
        }
    });
}

async function startServer() {
    try {
        await getDb();
        startListening(INITIAL_PORT);
    } catch (error) {
        console.error('No se pudo inicializar la base de datos:', error);
        process.exit(1);
    }
}

startServer();
