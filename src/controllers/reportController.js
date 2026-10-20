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
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro de imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, JPEG, PNG y WEBP.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Controlador para crear un reporte
const createReport = async (req, res) => {
    try {
        const { description, category, location, latitude, longitude } = req.body;
        
        if (!description || !category || !location) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (categoría, descripción o ubicación).' });
        }

        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const reportData = {
            description,
            category,
            location,
            latitude: latitude ? parseFloat(latitude) : 11.24079,
            longitude: longitude ? parseFloat(longitude) : -74.19904,
            image_url
        };

        const newReport = await reportService.createReport(reportData);
        res.status(201).json(newReport);
    } catch (error) {
        console.error('Error al crear el reporte:', error);
        res.status(400).json({ error: error.message || 'Ocurrió un error al crear el reporte.' });
    }
};

// Controlador para obtener reportes con filtros
const getAllReports = async (req, res) => {
    try {
        const { category, status, search } = req.query;
        const reports = await reportService.getAllReports({ category, status, search });
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
        res.status(500).json({ error: 'Ocurrió un error al obtener el reporte.' });
    }
};

// Controlador para buscar un reporte por Radicado
const getReportByRadicado = async (req, res) => {
    try {
        const { radicado } = req.params;
        const report = await reportService.getReportByRadicado(radicado);
        res.json(report);
    } catch (error) {
        res.status(404).json({ error: error.message });
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
        res.status(400).json({ error: error.message });
    }
};

// Controlador para registrar un voto ciudadano
const voteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedReport = await reportService.voteReport(id);
        res.json(updatedReport);
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al registrar el voto.' });
    }
};

// Controlador para notas administrativas
const updateAdminNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const updatedReport = await reportService.updateAdminNotes(id, notes);
        res.json(updatedReport);
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al actualizar las notas.' });
    }
};

// Controlador para eliminar reporte
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await reportService.deleteReport(id);
        res.json({ message: 'Reporte eliminado correctamente', report: deleted });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar el reporte.' });
    }
};

// Controlador para obtener estadísticas y métricas del Dashboard
const getStats = async (req, res) => {
    try {
        const stats = await reportService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error al calcular las estadísticas.' });
    }
};

module.exports = {
    upload,
    createReport,
    getAllReports,
    getReportById,
    getReportByRadicado,
    updateReportStatus,
    voteReport,
    updateAdminNotes,
    deleteReport,
    getStats
};
