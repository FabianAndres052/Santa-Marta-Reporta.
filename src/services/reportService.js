const reportRepository = require('../repositories/reportRepository');

// Servicio para manejar la lógica de creación de un reporte
async function createReport(reportData) {
    // Aquí podríamos agregar validaciones adicionales de negocio si fuera necesario
    // Por ahora, pasamos los datos al repositorio
    return await reportRepository.createReport(reportData);
}

// Servicio para obtener todos los reportes
async function getAllReports() {
    return await reportRepository.getAllReports();
}

// Servicio para obtener un reporte por su ID
async function getReportById(id) {
    const report = await reportRepository.getReportById(id);
    if (!report) {
        throw new Error('Reporte no encontrado');
    }
    return report;
}

// Servicio para actualizar el estado de un reporte
async function updateReportStatus(id, newStatus) {
    // Validar que el estado sea uno de los permitidos
    const validStatuses = ['Pendiente', 'En proceso', 'Resuelto'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error('Estado no válido. Debe ser "Pendiente", "En proceso" o "Resuelto".');
    }

    // Verificar si el reporte existe
    await getReportById(id);

    return await reportRepository.updateReportStatus(id, newStatus);
}

module.exports = {
    createReport,
    getAllReports,
    getReportById,
    updateReportStatus
};
