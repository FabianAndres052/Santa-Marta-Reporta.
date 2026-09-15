const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Ruta para crear un reporte (incluye middleware para la imagen)
// El campo del formulario que contenga la imagen debe llamarse 'image'
router.post('/', reportController.upload.single('image'), reportController.createReport);

// Ruta para obtener todos los reportes
router.get('/', reportController.getAllReports);

// Ruta para obtener un reporte por su ID
router.get('/:id', reportController.getReportById);

// Ruta para actualizar el estado de un reporte
router.put('/:id/status', reportController.updateReportStatus);

module.exports = router;
