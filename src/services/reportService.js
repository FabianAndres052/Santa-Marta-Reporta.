const reportRepository = require('../repositories/reportRepository');

// Servicio para crear reporte
async function createReport(reportData) {
    if (!reportData.description || reportData.description.trim().length < 5) {
        throw new Error('La descripción debe contener al menos 5 caracteres.');
    }
    if (!reportData.category) {
        throw new Error('La categoría es obligatoria.');
    }
    if (!reportData.location || reportData.location.trim().length < 3) {
        throw new Error('La ubicación es obligatoria.');
    }

    const lat = parseFloat(reportData.latitude) || 11.24079;
    const lng = parseFloat(reportData.longitude) || -74.19904;

    return await reportRepository.createReport({
        ...reportData,
        latitude: lat,
        longitude: lng
    });
}

// Servicio para obtener reportes con filtros
async function getAllReports(filters) {
    return await reportRepository.getAllReports(filters);
}

// Servicio para obtener un reporte por su ID
async function getReportById(id) {
    const report = await reportRepository.getReportById(id);
    if (!report) {
        throw new Error('Reporte no encontrado');
    }
    return report;
}

// Servicio para buscar por número de radicado
async function getReportByRadicado(radicado) {
    if (!radicado || radicado.trim() === '') {
        throw new Error('Debe proporcionar un número de radicado.');
    }
    const report = await reportRepository.getReportByRadicado(radicado);
    if (!report) {
        throw new Error(`No se encontró ningún reporte con el radicado ${radicado}.`);
    }
    return report;
}

// Servicio para actualizar el estado de un reporte
async function updateReportStatus(id, newStatus) {
    const validStatuses = ['Pendiente', 'En proceso', 'Resuelto'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error('Estado no válido. Debe ser "Pendiente", "En proceso" o "Resuelto".');
    }

    await getReportById(id);
    return await reportRepository.updateReportStatus(id, newStatus);
}

// Servicio para emitir voto
async function voteReport(id) {
    await getReportById(id);
    return await reportRepository.incrementVote(id);
}

// Servicio para notas administrativas
async function updateAdminNotes(id, notes) {
    await getReportById(id);
    return await reportRepository.updateAdminNotes(id, notes);
}

// Servicio para eliminar
async function deleteReport(id) {
    const deleted = await reportRepository.deleteReport(id);
    if (!deleted) {
        throw new Error('Reporte no encontrado para eliminar');
    }
    return deleted;
}

// Servicio para estadísticas
async function getStats() {
    return await reportRepository.getStats();
}

module.exports = {
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
