const { getDb } = require('../config/database');

// Crear un nuevo reporte en la base de datos
async function createReport(reportData) {
    const db = await getDb();
    const { description, category, location, image_url } = reportData;
    
    const result = await db.run(
        `INSERT INTO reports (description, category, location, image_url) 
         VALUES (?, ?, ?, ?)`,
        [description, category, location, image_url]
    );

    // Obtener y devolver el reporte recién creado
    return await getReportById(result.lastID);
}

// Obtener todos los reportes de la base de datos
async function getAllReports() {
    const db = await getDb();
    return await db.all('SELECT * FROM reports ORDER BY created_at DESC');
}

// Obtener un reporte específico por su ID
async function getReportById(id) {
    const db = await getDb();
    return await db.get('SELECT * FROM reports WHERE id = ?', [id]);
}

// Actualizar el estado de un reporte
async function updateReportStatus(id, newStatus) {
    const db = await getDb();
    await db.run(
        'UPDATE reports SET status = ? WHERE id = ?',
        [newStatus, id]
    );
    
    return await getReportById(id);
}

module.exports = {
    createReport,
    getAllReports,
    getReportById,
    updateReportStatus
};
