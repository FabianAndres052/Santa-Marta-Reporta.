const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authController = require('../controllers/authController');

// Ruta para estadísticas globales
router.get('/stats', reportController.getStats);

// Ruta para consulta directa por radicado (antes de /:id)
router.get('/radicado/:radicado', reportController.getReportByRadicado);

// Ruta para crear un reporte ciudadano (incluye upload de imagen)
router.post('/', reportController.upload.single('image'), reportController.createReport);

// Ruta para listar reportes con filtros
router.get('/', reportController.getAllReports);

// Ruta para reportes de un ciudadano específico
router.get('/citizen/:email', reportController.getCitizenReports);

// Ruta para obtener reporte por ID
router.get('/:id', reportController.getReportById);

// Ruta para registrar voto comunitario (Acción Ciudadana)
router.post('/:id/vote', reportController.voteReport);

// --- Rutas Protegidas de Gestión Administrativa y Cuadrillas ---
// Ruta para actualizar estado
router.put('/:id/status', authController.requireAuth, reportController.updateReportStatus);

// Ruta para registrar notas del administrador
router.put('/:id/notes', authController.requireAuth, reportController.updateAdminNotes);

// Ruta para eliminar reporte
router.delete('/:id', authController.requireAuth, reportController.deleteReport);

module.exports = router;
