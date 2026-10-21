const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Ruta para estadísticas globales
router.get('/stats', reportController.getStats);

// Ruta para consulta directa por radicado (antes de /:id)
router.get('/radicado/:radicado', reportController.getReportByRadicado);

// Ruta para crear un reporte (incluye upload de imagen)
router.post('/', reportController.upload.single('image'), reportController.createReport);

// Ruta para listar reportes con filtros
router.get('/', reportController.getAllReports);

// Ruta para obtener reporte por ID
router.get('/:id', reportController.getReportById);

// Ruta para actualizar estado
router.put('/:id/status', reportController.updateReportStatus);

// Ruta para registrar voto comunitario
router.post('/:id/vote', reportController.voteReport);

// Ruta para registrar notas del administrador
router.put('/:id/notes', reportController.updateAdminNotes);

// Ruta para eliminar reporte
router.delete('/:id', reportController.deleteReport);

module.exports = router;
