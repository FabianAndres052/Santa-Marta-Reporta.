const reportService = require('../services/reportService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurarse de que la carpeta uploads exista
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar un nombre único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, JPEG, PNG y WEBP.'), false);
    }
};

// Middleware de Multer
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5 MB
    }
});

// Controlador para crear un reporte
const createReport = async (req, res) => {
    try {
        const { description, category, location } = req.body;
        
        // Validaciones básicas
        if (!description || !category || !location) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (categoría, descripción o ubicación).' });
        }

        // Si se subió una imagen, guardar la ruta relativa
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const reportData = {
            description,
            category,
            location,
            image_url
        };

        const newReport = await reportService.createReport(reportData);
        res.status(201).json(newReport);
    } catch (error) {
        console.error('Error al crear el reporte:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear el reporte.' });
    }
};

// Controlador para obtener todos los reportes
const getAllReports = async (req, res) => {
    try {
        const reports = await reportService.getAllReports();
        res.json(reports);
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({ error: 'Ocurrió un error al obtener los reportes.' });
    }
};

// Controlador para obtener un reporte por ID
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await reportService.getReportById(id);
        res.json(report);
    } catch (error) {
        if (error.message === 'Reporte no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al obtener el reporte:', error);
        res.status(500).json({ error: 'Ocurrió un error al obtener el reporte.' });
    }
};

// Controlador para actualizar el estado de un reporte
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'El estado es obligatorio.' });
        }

        const updatedReport = await reportService.updateReportStatus(id, status);
        res.json(updatedReport);
    } catch (error) {
        if (error.message === 'Reporte no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Estado no válido')) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el estado.' });
    }
};

module.exports = {
    upload,
    createReport,
    getAllReports,
    getReportById,
    updateReportStatus
};
